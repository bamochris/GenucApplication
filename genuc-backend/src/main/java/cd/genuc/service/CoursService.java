package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.Cours.StatutCours;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service de gestion des cours en ligne GENUC
 */
@Service
@RequiredArgsConstructor
public class CoursService {

    private final CoursRepository coursRepo;
    private final LeconRepository leconRepo;
    private final SeanceLiveRepository seanceLiveRepo;
    private final ProgressionEtudiantRepository progressionRepo;
    private final UniversiteRepository universiteRepo;
    private final DepartementRepository departementRepo;
    private final InscriptionRepository inscriptionRepo;
    private final NoteRepository noteRepo;

    // ══════════════════════════════════════════
    // COURS — CRUD
    // ══════════════════════════════════════════

    /**
     * Lister les cours publiés d'une université (vue étudiant)
     */
    @Transactional(readOnly = true)
    public List<Cours> listerPublies(Long universiteId) {
        return coursRepo.findPubliesParUniversite(universiteId);
    }

    /**
     * Lister les cours publiés d'un département (vue publique)
     */
    @Transactional(readOnly = true)
    public List<Cours> listerPubliesParDepartement(Long departementId) {
        return coursRepo.findByDepartementIdAndStatut(departementId, StatutCours.PUBLIE);
    }

    /**
     * Lister les cours d'un département pour un niveau (vue étudiant)
     */
    @Transactional(readOnly = true)
    public List<Cours> listerParDeptEtNiveau(Long deptId, String niveau) {
        return coursRepo.findPubliesParDepartementEtNiveau(deptId, niveau);
    }

    /**
     * Lister tous les cours d'une université (vue admin/prof)
     */
    @Transactional(readOnly = true)
    public List<Cours> listerTous(Long universiteId) {
        return coursRepo.findByUniversiteId(universiteId);
    }

    /**
     * Lister les cours d'un professeur
     */
    @Transactional(readOnly = true)
    public List<Cours> mesCours(Long professeurId) {
        return coursRepo.findByProfesseurId(professeurId);
    }

    @Transactional(readOnly = true)
    public Cours obtenir(Long id) {
        return coursRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Cours introuvable : id=" + id));
    }

    /** Créer un nouveau cours */
    @Transactional
    public Cours creer(Map<String, Object> data) {
        Long universiteId  = Long.valueOf(data.get("universiteId").toString());
        Long departementId = Long.valueOf(data.get("departementId").toString());
        String code        = ((String) data.get("code")).toUpperCase().trim();

        Universite uni  = universiteRepo.findById(universiteId)
            .orElseThrow(() -> new RuntimeException("Université introuvable"));
        Departement dept = departementRepo.findById(departementId)
            .orElseThrow(() -> new RuntimeException("Département introuvable"));

        if (coursRepo.existsByCodeAndUniversiteId(code, universiteId)) {
            throw new RuntimeException("Le code cours '" + code + "' existe déjà dans cette université");
        }

        Cours cours = Cours.builder()
            .titre((String) data.get("titre"))
            .code(code)
            .description((String) data.get("description"))
            .niveau((String) data.get("niveau"))
            .credits(data.get("credits") != null
                ? Integer.valueOf(data.get("credits").toString()) : 3)
            .langue(data.getOrDefault("langue", "Français").toString())
            .thumbnail((String) data.get("thumbnail"))
            .enLigneSeulement(Boolean.TRUE.equals(data.get("enLigneSeulement")))
            .statut(StatutCours.BROUILLON)
            .universite(uni)
            .departement(dept)
            .professeurId(data.get("professeurId") != null
                ? Long.valueOf(data.get("professeurId").toString()) : null)
            .professeurNom((String) data.get("professeurNom"))
            .build();

        return coursRepo.save(cours);
    }

    /** Modifier un cours */
    @Transactional
    public Cours modifier(Long id, Map<String, Object> data) {
        Cours cours = obtenir(id);

        if (data.containsKey("titre"))         cours.setTitre((String) data.get("titre"));
        if (data.containsKey("description"))   cours.setDescription((String) data.get("description"));
        if (data.containsKey("niveau"))        cours.setNiveau((String) data.get("niveau"));
        if (data.containsKey("credits"))       cours.setCredits(Integer.valueOf(data.get("credits").toString()));
        if (data.containsKey("langue"))        cours.setLangue((String) data.get("langue"));
        if (data.containsKey("thumbnail"))     cours.setThumbnail((String) data.get("thumbnail"));
        if (data.containsKey("professeurNom")) cours.setProfesseurNom((String) data.get("professeurNom"));

        return coursRepo.save(cours);
    }

    /** Publier un cours (le rendre visible aux étudiants) */
    @Transactional
    public Cours publier(Long id) {
        Cours cours = obtenir(id);
        long nbLecons = leconRepo.countByCoursId(id);
        if (nbLecons == 0) {
            throw new RuntimeException("Impossible de publier un cours sans leçons");
        }
        cours.setStatut(StatutCours.PUBLIE);
        cours.setPublieLe(LocalDateTime.now());
        return coursRepo.save(cours);
    }

    /** Archiver un cours */
    @Transactional
    public Cours archiver(Long id) {
        Cours cours = obtenir(id);
        cours.setStatut(StatutCours.ARCHIVE);
        return coursRepo.save(cours);
    }

    // ══════════════════════════════════════════
    // LEÇONS
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<Lecon> listerLecons(Long coursId) {
        return leconRepo.findByCoursIdOrderByOrdreAsc(coursId);
    }

    @Transactional(readOnly = true)
    public Lecon obtenirLecon(Long id) {
        return leconRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Leçon introuvable : id=" + id));
    }

    @Transactional
    public Lecon ajouterLecon(Long coursId, Map<String, Object> data) {
        Cours cours = obtenir(coursId);

        // L'ordre par défaut = nb leçons existantes + 1
        long nbExistantes = leconRepo.countByCoursId(coursId);
        int ordre = data.get("ordre") != null
            ? Integer.valueOf(data.get("ordre").toString())
            : (int) nbExistantes + 1;

        Lecon lecon = Lecon.builder()
            .titre((String) data.get("titre"))
            .description((String) data.get("description"))
            .ordre(ordre)
            .type(Lecon.TypeLecon.valueOf(
                data.getOrDefault("type", "VIDEO").toString()))
            .videoUrl((String) data.get("videoUrl"))
            .videoExterneUrl((String) data.get("videoExterneUrl"))
            .dureeSecondes(data.get("dureeSecondes") != null
                ? Integer.valueOf(data.get("dureeSecondes").toString()) : null)
            .documentUrl((String) data.get("documentUrl"))
            .documentNom((String) data.get("documentNom"))
            .contenuHtml((String) data.get("contenuHtml"))
            .aperçuGratuit(Boolean.TRUE.equals(data.get("aperçuGratuit")))
            .cours(cours)
            .actif(true)
            .build();

        Lecon saved = leconRepo.save(lecon);

        // Mettre à jour le compteur et la durée totale du cours
        cours.setNombreLecons((int) leconRepo.countByCoursId(coursId));
        if (lecon.getDureeSecondes() != null) {
            int total = cours.getDureeTotaleMinutes() == null ? 0 : cours.getDureeTotaleMinutes();
            cours.setDureeTotaleMinutes(total + lecon.getDureeSecondes() / 60);
        }
        coursRepo.save(cours);

        return saved;
    }

    @Transactional
    public void supprimerLecon(Long leconId) {
        Lecon lecon = obtenirLecon(leconId);
        lecon.setActif(false);
        leconRepo.save(lecon);
        // Mettre à jour le compteur
        Cours cours = lecon.getCours();
        cours.setNombreLecons((int) leconRepo.countByCoursId(cours.getId()));
        coursRepo.save(cours);
    }

    // ══════════════════════════════════════════
    // SÉANCES LIVE
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<SeanceLive> listerSeancesLive(Long coursId) {
        return seanceLiveRepo.findByCoursId(coursId);
    }

    @Transactional(readOnly = true)
    public List<SeanceLive> prochainesSeances(Long universiteId) {
        return seanceLiveRepo.prochainesSeances(universiteId, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<SeanceLive> seancesEnCours() {
        return seanceLiveRepo.seancesEnCours();
    }

    @Transactional
    public SeanceLive planifierSeance(Long coursId, Map<String, Object> data) {
        Cours cours = obtenir(coursId);

        LocalDateTime dateDebut = LocalDateTime.parse((String) data.get("dateDebut"));
        if (dateDebut.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("La date de la séance doit être dans le futur");
        }

        // Générer un lien Jitsi automatiquement si non fourni
        String lienReunion = (String) data.get("lienReunion");
        SeanceLive.PlateformeVideo plateforme = data.get("plateforme") != null
            ? SeanceLive.PlateformeVideo.valueOf((String) data.get("plateforme"))
            : SeanceLive.PlateformeVideo.JITSI;

        if (lienReunion == null && plateforme == SeanceLive.PlateformeVideo.JITSI) {
            String roomId = cours.getCode().toLowerCase() + "-"
                + System.currentTimeMillis();
            lienReunion = "https://meet.jit.si/genuc-" + roomId;
        }

        SeanceLive seance = SeanceLive.builder()
            .titre((String) data.get("titre"))
            .description((String) data.get("description"))
            .dateDebut(dateDebut)
            .dureePrevueMinutes(data.get("dureePrevueMinutes") != null
                ? Integer.valueOf(data.get("dureePrevueMinutes").toString()) : 90)
            .statut(SeanceLive.StatutSeance.PLANIFIEE)
            .plateforme(plateforme)
            .lienReunion(lienReunion)
            .codeAcces((String) data.get("codeAcces"))
            .enregistrable(!Boolean.FALSE.equals(data.get("enregistrable")))
            .cours(cours)
            .professeurId(data.get("professeurId") != null
                ? Long.valueOf(data.get("professeurId").toString()) : null)
            .professeurNom((String) data.get("professeurNom"))
            .build();

        return seanceLiveRepo.save(seance);
    }

    @Transactional
    public SeanceLive demarrerSeance(Long seanceId) {
        SeanceLive seance = seanceLiveRepo.findById(seanceId)
            .orElseThrow(() -> new RuntimeException("Séance introuvable"));
        seance.setStatut(SeanceLive.StatutSeance.EN_COURS);
        return seanceLiveRepo.save(seance);
    }

    @Transactional
    public SeanceLive terminerSeance(Long seanceId, String urlEnregistrement) {
        SeanceLive seance = seanceLiveRepo.findById(seanceId)
            .orElseThrow(() -> new RuntimeException("Séance introuvable"));
        seance.setStatut(SeanceLive.StatutSeance.TERMINEE);
        if (urlEnregistrement != null) seance.setUrlEnregistrement(urlEnregistrement);
        return seanceLiveRepo.save(seance);
    }

    // ══════════════════════════════════════════
    // PROGRESSION ÉTUDIANT
    // ══════════════════════════════════════════

    /**
     * Obtenir ou créer la progression d'un étudiant pour un cours
     */
    @Transactional
    public ProgressionEtudiant obtenirOuCreerProgression(Long inscriptionId, Long coursId) {
        return progressionRepo.findByInscriptionIdAndCoursId(inscriptionId, coursId)
            .orElseGet(() -> {
                Inscription inscription = new Inscription();
                inscription.setId(inscriptionId);
                Cours cours = obtenir(coursId);

                ProgressionEtudiant prog = ProgressionEtudiant.builder()
                    .inscription(inscription)
                    .cours(cours)
                    .leconsTotal(cours.getNombreLecons())
                    .build();
                return progressionRepo.save(prog);
            });
    }

    /**
     * Marquer une leçon comme complétée
     */
    @Transactional
    public ProgressionEtudiant marquerLeconCompletee(
            Long inscriptionId, Long coursId, Long leconId, int tempsMinutes) {

        ProgressionEtudiant prog = obtenirOuCreerProgression(inscriptionId, coursId);
        prog.marquerLeconCompletee(leconId);
        prog.setTempsPasseMinutes(prog.getTempsPasseMinutes() + tempsMinutes);
        prog.setLeconsTotal(obtenir(coursId).getNombreLecons());
        prog.recalculerPourcentage();
        return progressionRepo.save(prog);
    }

    /**
     * Tous mes cours avec progression (vue étudiant)
     */
    @Transactional(readOnly = true)
    public List<ProgressionEtudiant> mesProgressions(Long inscriptionId) {
        return progressionRepo.findByInscriptionId(inscriptionId);
    }

    /**
     * Stats d'un cours (vue professeur)
     */
    /** Étudiants inscrits à un cours (via la promotion rattachée au cours) */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> etudiantsInscrits(Long coursId) {
        Cours cours = obtenir(coursId);
        if (cours.getPromotion() == null) {
            throw new RuntimeException("Ce cours n'est rattaché à aucune promotion — impossible de déterminer les étudiants inscrits");
        }
        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(cours.getPromotion().getId())
            .stream()
            .filter(i -> i.getStatut() == StatutInscription.VALIDE)
            .toList();

        String annee = cours.getAnneeAcademique();
        return inscriptions.stream().map(ins -> {
            List<Note> notes = annee != null
                ? noteRepo.findByCoursIdAndAnneeAcademique(coursId, annee).stream()
                    .filter(n -> n.getInscription().getId().equals(ins.getId()))
                    .toList()
                : List.<Note>of();
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", ins.getId());
            m.put("inscriptionId", ins.getId());
            m.put("matricule", ins.getMatricule());
            m.put("nom", ins.getNom());
            m.put("prenom", ins.getPrenom());
            m.put("email", ins.getEmail());
            m.put("notes", notes);
            return m;
        }).toList();
    }

    public Map<String, Object> statsCours(Long coursId) {
        Cours cours = obtenir(coursId);
        long nbInscrits  = progressionRepo.findByCoursId(coursId).size();
        long nbCompletes = progressionRepo.countEtudiantsAyantComplete(coursId);
        Double moyProg   = progressionRepo.moyenneProgressionCours(coursId);

        return Map.of(
            "cours",          cours.getTitre(),
            "code",           cours.getCode(),
            "nbLecons",       cours.getNombreLecons(),
            "nbInscrits",     nbInscrits,
            "nbCompletes",    nbCompletes,
            "moyenneProgression", moyProg != null ? Math.round(moyProg) : 0,
            "tauxCompletion", nbInscrits > 0
                ? Math.round((double) nbCompletes / nbInscrits * 100) : 0
        );
    }
}