package cd.genuc.service;

import cd.genuc.config.cache.CacheNames;
import cd.genuc.exception.*;
import cd.genuc.model.*;
import cd.genuc.model.Note.StatutNote;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

/**
 * Service de gestion des notes GENUC
 */
@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepo;
    private final ExamenRepository examenRepo;
    private final InscriptionRepository inscriptionRepo;
    private final CoursRepository coursRepo;
    private final UniversiteRepository universiteRepo;

    // ══════════════════════════════════════════
    // SAISIE DES NOTES (Professeur)
    // ══════════════════════════════════════════

    /**
     * Saisit ou met à jour la note d'un étudiant pour un cours.
     * Calcule automatiquement la note finale.
     */
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheNames.NOTES, key = "#data['inscriptionId'] + '-' + #data['anneeAcademique']"),
        // Les statistiques d'un cours changent à chaque note saisie. Sans cette seconde
        // éviction, statsCours() servait une moyenne de classe figée pendant tout le TTL.
        @CacheEvict(value = CacheNames.NOTES, key = "'stats-' + #data['coursId'] + '-' + #data['anneeAcademique']")
    })
    public Note saisir(Map<String, Object> data) {
        Long inscriptionId = Long.valueOf(data.get("inscriptionId").toString());
        Long coursId       = Long.valueOf(data.get("coursId").toString());
        String annee       = (String) data.get("anneeAcademique");
        int session        = data.get("session") != null
            ? Integer.parseInt(data.get("session").toString()) : 1;

        Inscription inscription = inscriptionRepo.findById(inscriptionId)
            .orElseThrow(() -> new InscriptionNotFoundException(inscriptionId));
        Cours cours = coursRepo.findById(coursId)
            .orElseThrow(() -> new CoursNotFoundException(coursId));

        // Récupérer la note existante ou en créer une nouvelle
        Note note = noteRepo.findByInscriptionIdAndCoursIdAndAnneeAcademiqueAndSession(
                inscriptionId, coursId, annee, session)
            .orElse(Note.builder()
                .inscription(inscription)
                .cours(cours)
                .universite(inscription.getUniversite())
                .anneeAcademique(annee)
                .session(session)
                .credits(cours.getCredits())
                .noteMax(20.0)
                .build());

        // Remplir les composantes
        if (data.containsKey("noteTP"))
            note.setNoteTP(parseDouble(data.get("noteTP")));
        if (data.containsKey("noteInterrogation"))
            note.setNoteInterrogation(parseDouble(data.get("noteInterrogation")));
        if (data.containsKey("noteExamen"))
            note.setNoteExamen(parseDouble(data.get("noteExamen")));
        if (data.containsKey("nbAbsences"))
            note.setNbAbsences(Integer.parseInt(data.get("nbAbsences").toString()));
        if (data.containsKey("appreciation"))
            note.setAppreciation((String) data.get("appreciation"));

        note.setProfesseurId(data.get("professeurId") != null
            ? Long.valueOf(data.get("professeurId").toString()) : null);

        // Calculer la note finale automatiquement
        note.calculerNoteFinale();

        // Vérifier exclusion pour absences (> 1/3 des séances)
        if (data.containsKey("totalSeances")) {
            int totalSeances = Integer.parseInt(data.get("totalSeances").toString());
            if (note.getNbAbsences() > totalSeances / 3) {
                note.setExcluAbsences(true);
                note.setNoteFinale(0.0);
                note.setNoteRetenue(0.0);
                note.setMention(Note.MentionNote.AJOURNE);
                note.setAppreciation("Exclu pour absences répétées");
            }
        }

        note.setStatut(StatutNote.SOUMISE);
        return noteRepo.save(note);
    }

    /**
     * Saisie en lot — tableau de notes pour un cours entier
     *
     * <p>Éviction globale : {@link #saisir(Map)} est appelée en interne, donc sans passer par
     * le proxy Spring — ses propres {@code @CacheEvict} ne se déclenchent pas ici. Les notes
     * d'un cours entier touchant autant d'inscriptions que d'étudiants, purger le cache
     * {@code notes} est de toute façon plus simple et plus sûr qu'énumérer les clés.</p>
     */
    @Transactional
    @CacheEvict(value = CacheNames.NOTES, allEntries = true)
    public List<Note> saisirEnLot(Long coursId, String annee, List<Map<String, Object>> notes) {
        List<Note> resultats = new ArrayList<>();
        for (Map<String, Object> data : notes) {
            data.put("coursId", coursId);
            data.put("anneeAcademique", annee);
            resultats.add(saisir(data));
        }
        return resultats;
    }

    /**
     * Saisir une note de rattrapage (session 2)
     */
    @Transactional
    @CacheEvict(value = CacheNames.NOTES, allEntries = true)
    public Note saisirRattrapage(Long noteId, double noteRattrapage, Long professeurId) {
        Note note = obtenir(noteId);

        if (note.getStatut() != StatutNote.PUBLIEE) {
            throw new NoteStatutException(note.getStatut().name(), "rattrapage");
        }

        note.appliquerRattrapage(noteRattrapage);
        note.setProfesseurId(professeurId);
        note.setStatut(StatutNote.SOUMISE);
        return noteRepo.save(note);
    }

    // ══════════════════════════════════════════
    // VALIDATION (Chef de département)
    // ══════════════════════════════════════════

    // Éviction sur TOUT changement de statut : mesNotes() ne renvoie que les notes PUBLIEE.
    // Sans cela, une note publiée restait invisible pour l'étudiant jusqu'à expiration du TTL
    // — le cas classique du « j'ai publié les notes mais elles n'apparaissent pas ». Les
    // clés dépendent de données connues seulement après chargement, et une publication est
    // une action administrative rare : la purge du cache est ici le bon compromis.
    @Transactional
    @CacheEvict(value = CacheNames.NOTES, allEntries = true)
    public Note valider(Long id) {
        Note note = obtenir(id);
        if (note.getStatut() != StatutNote.SOUMISE) {
            throw new NoteStatutException(note.getStatut().name(), "validation");
        }
        note.setStatut(StatutNote.VALIDEE);
        return noteRepo.save(note);
    }

    @Transactional
    @CacheEvict(value = CacheNames.NOTES, allEntries = true)
    public List<Note> validerToutesLesCours(Long coursId, String annee) {
        List<Note> notes = noteRepo.findByCoursIdAndAnneeAcademique(coursId, annee);
        notes.stream()
            .filter(n -> n.getStatut() == StatutNote.SOUMISE)
            .forEach(n -> { n.setStatut(StatutNote.VALIDEE); noteRepo.save(n); });
        return notes;
    }

    // ══════════════════════════════════════════
    // PUBLICATION (Admin)
    // ══════════════════════════════════════════

    @Transactional
    @CacheEvict(value = CacheNames.NOTES, allEntries = true)
    public Note publier(Long id) {
        Note note = obtenir(id);
        if (note.getStatut() != StatutNote.VALIDEE) {
            throw new NoteStatutException(note.getStatut().name(), "publication");
        }
        note.setStatut(StatutNote.PUBLIEE);
        return noteRepo.save(note);
    }

    @Transactional
    @CacheEvict(value = CacheNames.NOTES, allEntries = true)
    public int publierParCours(Long coursId, String annee) {
        List<Note> notes = noteRepo.findByCoursIdAndAnneeAcademique(coursId, annee);
        int count = 0;
        for (Note n : notes) {
            if (n.getStatut() == StatutNote.VALIDEE) {
                n.setStatut(StatutNote.PUBLIEE);
                noteRepo.save(n);
                count++;
            }
        }
        return count;
    }

    // ══════════════════════════════════════════
    // CONSULTATION
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public Note obtenir(Long id) {
        return noteRepo.findById(id)
            .orElseThrow(() -> new NoteNotFoundException(id));
    }

    /** Notes d'un étudiant pour une année (vue étudiant — publiées seulement) */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.NOTES, key = "#inscriptionId + '-' + #annee")
    public List<Note> mesNotes(Long inscriptionId, String annee) {
        return noteRepo.findByInscriptionIdAndAnneeAcademique(inscriptionId, annee)
            .stream()
            .filter(n -> n.getStatut() == StatutNote.PUBLIEE)
            .toList();
    }

    /** Calcul et enregistrement groupé des notes (TP/Interro/Examen) pour tout un cours */
    @Transactional
    @CacheEvict(value = CacheNames.NOTES, allEntries = true)
    public List<Note> calculerEtEnregistrer(Long coursId, String anneeAcademique, List<Map<String, Object>> lignes) {
        List<Note> resultats = new ArrayList<>();
        for (Map<String, Object> ligne : lignes) {
            Map<String, Object> data = new HashMap<>(ligne);
            data.put("coursId", coursId);
            data.put("anneeAcademique", anneeAcademique);
            resultats.add(saisir(data));
        }
        return resultats;
    }

    /** Toutes les notes d'un cours (vue professeur) */
    @Transactional(readOnly = true)
    public List<Note> notesDuCours(Long coursId, String annee) {
        return noteRepo.findByCoursIdAndAnneeAcademique(coursId, annee);
    }

    /** Notes à valider */
    @Transactional(readOnly = true)
    public List<Note> notesASoumettre(Long universiteId) {
        return noteRepo.findByUniversiteIdAndStatut(universiteId, StatutNote.SOUMISE);
    }

    /** Notes à valider (vue chef de département) */
    @Transactional(readOnly = true)
    public List<Note> notesASoumettreParDepartement(Long departementId) {
        return noteRepo.findByCours_Departement_IdAndStatut(departementId, StatutNote.SOUMISE);
    }

    /** Stats d'un cours */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.NOTES, key = "'stats-' + #coursId + '-' + #annee")
    public Map<String, Object> statsCours(Long coursId, String annee) {
        Double moyenne = noteRepo.moyenneCours(coursId, annee);
        long nbReussis = noteRepo.nbReussis(coursId, annee);
        long total     = noteRepo.nbNotes(coursId, annee);

        return Map.of(
            "moyenneClasse",  moyenne != null ? Math.round(moyenne * 100.0) / 100.0 : 0,
            "nbReussis",      nbReussis,
            "nbAjournes",     total - nbReussis,
            "tauxReussite",   total > 0 ? Math.round((double) nbReussis / total * 100) : 0,
            "totalNotes",     total
        );
    }

    // ══════════════════════════════════════════
    // EXAMENS
    // ══════════════════════════════════════════

    // prochains() est cachée par université : planifier un examen doit purger cette liste,
    // sinon un examen ajouté n'apparaît au calendrier des étudiants qu'au bout de 15 min.
    @Transactional
    @CacheEvict(value = CacheNames.EXAMENS, key = "'prochains-' + #data['universiteId']")
    public Examen planifierExamen(Map<String, Object> data) {
        Long coursId  = Long.valueOf(data.get("coursId").toString());
        Long uniId    = Long.valueOf(data.get("universiteId").toString());

        Cours cours = coursRepo.findById(coursId)
            .orElseThrow(() -> new CoursNotFoundException(coursId));
        Universite uni = universiteRepo.findById(uniId)
            .orElseThrow(() -> new UniversiteNotFoundException(uniId));

        LocalDate date = LocalDate.parse((String) data.get("date"));

        Examen examen = Examen.builder()
            .titre((String) data.get("titre"))
            .date(date)
            .heureDebut(data.get("heureDebut") != null
                ? java.time.LocalTime.parse((String) data.get("heureDebut")) : null)
            .heureFin(data.get("heureFin") != null
                ? java.time.LocalTime.parse((String) data.get("heureFin")) : null)
            .dureeMinutes(data.get("dureeMinutes") != null
                ? Integer.parseInt(data.get("dureeMinutes").toString()) : 120)
            .type(Examen.TypeExamen.valueOf(
                data.getOrDefault("type", "EXAMEN_SESSION").toString()))
            .salle((String) data.get("salle"))
            .capaciteSalle(data.get("capaciteSalle") != null
                ? Integer.parseInt(data.get("capaciteSalle").toString()) : null)
            .instructions((String) data.get("instructions"))
            .anneeAcademique((String) data.get("anneeAcademique"))
            .session(data.get("session") != null
                ? Integer.parseInt(data.get("session").toString()) : 1)
            .professeurId(data.get("professeurId") != null
                ? Long.valueOf(data.get("professeurId").toString()) : null)
            .professeurNom((String) data.get("professeurNom"))
            .cours(cours)
            .universite(uni)
            .statut(Examen.StatutExamen.PLANIFIE)
            .build();

        return examenRepo.save(examen);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.EXAMENS, key = "'prochains-' + #universiteId")
    public List<Examen> prochains(Long universiteId) {
        return examenRepo.prochains(universiteId, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<Examen> examensAujourdhui() {
        return examenRepo.examensAujourdhui(LocalDate.now());
    }

    @Transactional
    @CacheEvict(value = CacheNames.EXAMENS, allEntries = true)
    public Examen changerStatutExamen(Long id, Examen.StatutExamen statut) {
        Examen e = examenRepo.findById(id)
            .orElseThrow(() -> new ExamenNotFoundException(id));
        e.setStatut(statut);
        return examenRepo.save(e);
    }

    // ── Utilitaire ────────────────────────────────────────────

    private Double parseDouble(Object val) {
        return val != null ? Double.parseDouble(val.toString()) : null;
    }
}
