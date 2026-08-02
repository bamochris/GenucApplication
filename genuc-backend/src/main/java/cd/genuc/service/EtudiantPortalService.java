package cd.genuc.service;

import cd.genuc.dto.EtudiantDashboardDto;
import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EtudiantPortalService {

    private final InscriptionRepository inscriptionRepo;
    private final CoursRepository coursRepo;
    private final ProgressionEtudiantRepository progressionRepo;
    private final NoteRepository noteRepo;
    private final PaiementService paiementService;
    private final ExamenRepository examenRepo;
    private final SeanceLiveRepository seanceRepo;
    private final DeliberationRepository deliberationRepo;
    private final DeliberationService deliberationService;

    // ══════════════════════════════════════════
    // 1. Dashboard principal
    // ══════════════════════════════════════════

    public EtudiantDashboardDto getDashboard(Long inscriptionId) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
            .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        String anneeCourante = getCurrentAcademicYear();

        // Récupération des notes
        List<Note> notes = new ArrayList<>();
        try {
            notes = noteRepo.findByInscriptionIdAndAnneeAcademique(inscriptionId, anneeCourante)
                .stream()
                .filter(n -> n.getStatut() == Note.StatutNote.PUBLIEE)
                .collect(Collectors.toList());
        } catch (Exception e) {
            notes = new ArrayList<>();
        }

        double moyenne = notes.stream()
            .mapToDouble(n -> n.getNoteRetenue() != null ? n.getNoteRetenue() : 0)
            .average()
            .orElse(0);

        int creditsValides = notes.stream()
            .filter(n -> n.getNoteRetenue() != null && n.getNoteRetenue() >= 10)
            .mapToInt(n -> n.getCredits() != null ? n.getCredits() : 0)
            .sum();

        // Situation financière
        double solde = 0;
        try {
            Map<String, Object> situationFinanciere = paiementService.situationFinanciere(inscriptionId);
            Object soldeObj = situationFinanciere.getOrDefault("soldeRestant", 0.0);
            solde = soldeObj instanceof Number ? ((Number) soldeObj).doubleValue() : 0.0;
        } catch (Exception e) {
            solde = 0;
        }

        // Progression
        List<ProgressionEtudiant> progressions = new ArrayList<>();
        try {
            progressions = progressionRepo.findByInscriptionId(inscriptionId);
        } catch (Exception e) {
            progressions = new ArrayList<>();
        }

        int progressionGlobale = 0;
        if (!progressions.isEmpty()) {
            double avg = progressions.stream()
                .mapToInt(p -> p.getPourcentageCompletion() != null ? p.getPourcentageCompletion() : 0)
                .average()
                .orElse(0);
            progressionGlobale = (int) avg;
        }

        // Stats
        long totalCours = 0;
        try {
            totalCours = coursRepo.countPubliesParUniversite(inscription.getUniversite().getId());
        } catch (Exception e) {
            totalCours = 0;
        }

        long coursCompletes = progressions.stream()
        	    .filter(p -> p.isCoursComplete())  // boolean ne peut pas être null
        	    .count();

        EtudiantDashboardDto.StatsDto stats = EtudiantDashboardDto.StatsDto.builder()
            .totalCours((int) totalCours)
            .coursCompletes((int) coursCompletes)
            .totalSeances(0)
            .seancesSuivies(0)
            .messagesNonLus(0)
            .build();

        // Nom de l'étudiant
        String nomEtudiant = "";
        if (inscription.getEtudiant() != null) {
            String prenom = inscription.getEtudiant().getPrenom() != null ? inscription.getEtudiant().getPrenom() : "";
            String nom = inscription.getEtudiant().getNom() != null ? inscription.getEtudiant().getNom() : "";
            nomEtudiant = prenom + " " + nom;
        } else {
            String prenom = inscription.getPrenom() != null ? inscription.getPrenom() : "";
            String nom = inscription.getNom() != null ? inscription.getNom() : "";
            nomEtudiant = prenom + " " + nom;
        }

        return EtudiantDashboardDto.builder()
            .matricule(inscription.getMatricule())
            .nomComplet(nomEtudiant.trim())
            .email(inscription.getEmail())
            .photo(null)
            .universite(inscription.getUniversite() != null ? inscription.getUniversite().getNom() : "—")
            .departement(inscription.getDepartement() != null ? inscription.getDepartement().getNom() : "—")
            .filiere(inscription.getFiliere() != null ? inscription.getFiliere().getNom() : "—")
            .promotion(inscription.getPromotion() != null ? inscription.getPromotion().getLibelle() : "—")
            .niveau(inscription.getNiveau())
            .anneeAcademique(anneeCourante)
            .moyenneGenerale(Math.round(moyenne * 100.0) / 100.0)
            .creditsValides(creditsValides)
            .soldeAPayer(solde)
            .progressionGlobale(progressionGlobale)
            .notifications(new ArrayList<>())
            .prochainsCours(new ArrayList<>())
            .prochainsExamens(new ArrayList<>())
            .stats(stats)
            .build();
    }

    // ══════════════════════════════════════════
    // 2. Mes cours avec progression
    // ══════════════════════════════════════════

    public List<Map<String, Object>> mesCoursAvecProgression(Long inscriptionId) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
            .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        List<Cours> coursList = new ArrayList<>();
        try {
            // Utiliser findPubliesParUniversite si findPubliesParDepartementEtNiveau n'existe pas
            coursList = coursRepo.findPubliesParUniversite(inscription.getUniversite().getId());
        } catch (Exception e) {
            coursList = new ArrayList<>();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Cours cours : coursList) {
            ProgressionEtudiant prog = null;
            try {
                Optional<ProgressionEtudiant> optProg = progressionRepo.findByInscriptionIdAndCoursId(inscriptionId, cours.getId());
                if (optProg.isPresent()) {
                    prog = optProg.get();
                }
            } catch (Exception e) {
                // Ignorer
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", cours.getId());
            map.put("titre", cours.getTitre());
            map.put("code", cours.getCode());
            map.put("description", cours.getDescription());
            map.put("professeur", cours.getProfesseurNom() != null ? cours.getProfesseurNom() : "À définir");
            map.put("thumbnail", cours.getThumbnail());
            map.put("nbLecons", cours.getNombreLecons() != null ? cours.getNombreLecons() : 0);
            map.put("progression", prog != null && prog.getPourcentageCompletion() != null ? prog.getPourcentageCompletion() : 0);
            map.put("estComplete", prog != null && prog.isCoursComplete());
            map.put("dateDernierAcces", prog != null && prog.getDernierAcces() != null ? prog.getDernierAcces().toString() : null);
            result.add(map);
        }
        return result;
    }

    // ══════════════════════════════════════════
    // 3. Détail d'un cours
    // ══════════════════════════════════════════

    public Map<String, Object> detailCours(Long inscriptionId, Long coursId) {
        Cours cours = coursRepo.findById(coursId)
            .orElseThrow(() -> new RuntimeException("Cours introuvable"));

        ProgressionEtudiant prog = null;
        try {
            Optional<ProgressionEtudiant> optProg = progressionRepo.findByInscriptionIdAndCoursId(inscriptionId, coursId);
            if (optProg.isPresent()) {
                prog = optProg.get();
            }
        } catch (Exception e) {
            // Ignorer
        }

        List<Lecon> lecons = new ArrayList<>();
        if (cours.getLecons() != null) {
            lecons = cours.getLecons().stream()
                .filter(l -> l.isActif())
                .sorted(Comparator.comparing(Lecon::getOrdre))
                .collect(Collectors.toList());
        }

        List<Map<String, Object>> leconsWithStatut = new ArrayList<>();
        for (Lecon lecon : lecons) {
            Map<String, Object> l = new HashMap<>();
            l.put("id", lecon.getId());
            l.put("titre", lecon.getTitre());
            l.put("description", lecon.getDescription());
            l.put("ordre", lecon.getOrdre());
            l.put("type", lecon.getType() != null ? lecon.getType().name() : "VIDEO");
            l.put("videoUrl", lecon.getVideoUrl());
            l.put("videoExterneUrl", lecon.getVideoExterneUrl());
            l.put("documentUrl", lecon.getDocumentUrl());
            l.put("contenuHtml", lecon.getContenuHtml());
            l.put("dureeSecondes", lecon.getDureeSecondes());
            l.put("apercuGratuit", lecon.isAperçuGratuit());

            boolean estCompletee = false;
            if (prog != null && prog.getLeconsCompleteesList() != null) {
                estCompletee = prog.getLeconsCompleteesList().contains(String.valueOf(lecon.getId()));
            }
            l.put("estCompletee", estCompletee);
            leconsWithStatut.add(l);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, Object> coursInfo = new HashMap<>();
        coursInfo.put("id", cours.getId());
        coursInfo.put("titre", cours.getTitre());
        coursInfo.put("code", cours.getCode());
        coursInfo.put("description", cours.getDescription());
        coursInfo.put("professeur", cours.getProfesseurNom());
        coursInfo.put("thumbnail", cours.getThumbnail());
        coursInfo.put("statut", cours.getStatut() != null ? cours.getStatut().name() : "BROUILLON");
        result.put("cours", coursInfo);
        result.put("progression", prog != null && prog.getPourcentageCompletion() != null ? prog.getPourcentageCompletion() : 0);
        result.put("lecons", leconsWithStatut);
        result.put("seancesLive", new ArrayList<>());
        return result;
    }

    // ══════════════════════════════════════════
    // 4. Mes notes
    // ══════════════════════════════════════════

    public Map<String, Object> mesNotes(Long inscriptionId, String annee) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
            .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        if (annee == null || annee.isEmpty()) {
            annee = getCurrentAcademicYear();
        }

        List<Note> notes = new ArrayList<>();
        try {
            notes = noteRepo.findByInscriptionIdAndAnneeAcademique(inscriptionId, annee)
                .stream()
                .filter(n -> n.getStatut() == Note.StatutNote.PUBLIEE)
                .collect(Collectors.toList());
        } catch (Exception e) {
            notes = new ArrayList<>();
        }

        double moyenne = notes.stream()
            .mapToDouble(n -> n.getNoteRetenue() != null ? n.getNoteRetenue() : 0)
            .average()
            .orElse(0);

        int creditsValides = notes.stream()
            .filter(n -> n.getNoteRetenue() != null && n.getNoteRetenue() >= 10)
            .mapToInt(n -> n.getCredits() != null ? n.getCredits() : 0)
            .sum();

        List<Map<String, Object>> notesList = new ArrayList<>();
        for (Note n : notes) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("cours", n.getCours().getTitre());
            map.put("code", n.getCours().getCode());
            map.put("credits", n.getCredits());
            map.put("noteTP", n.getNoteTP());
            map.put("noteInterrogation", n.getNoteInterrogation());
            map.put("noteExamen", n.getNoteExamen());
            map.put("noteFinale", n.getNoteRetenue() != null ? n.getNoteRetenue() : n.getNoteFinale());
            map.put("noteMax", n.getNoteMax());
            map.put("mention", n.getMention() != null ? n.getMention().name() : "—");
            map.put("session", n.getSession());
            notesList.add(map);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("anneeAcademique", annee);
        result.put("moyenneGenerale", Math.round(moyenne * 100.0) / 100.0);
        result.put("creditsValides", creditsValides);
        result.put("notes", notesList);
        return result;
    }

    // ══════════════════════════════════════════
    // 5. Relevé de notes
    // ══════════════════════════════════════════

    public Map<String, Object> releveNotes(Long inscriptionId, String annee) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
            .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        if (annee == null || annee.isEmpty()) {
            annee = getCurrentAcademicYear();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("matricule", inscription.getMatricule());
        result.put("nom", inscription.getNom());
        result.put("prenom", inscription.getPrenom());
        result.put("universite", inscription.getUniversite() != null ? inscription.getUniversite().getNom() : "—");
        result.put("anneeAcademique", annee);
        
        Map<String, Object> notesData = mesNotes(inscriptionId, annee);
        result.put("notes", notesData.get("notes"));
        result.put("moyenneGenerale", notesData.get("moyenneGenerale"));
        result.put("creditsValides", notesData.get("creditsValides"));
        
        return result;
    }

    // ══════════════════════════════════════════
    // 6. Marquer une leçon comme complétée
    // ══════════════════════════════════════════

    @Transactional
    public Map<String, Object> marquerLeconCompletee(Long inscriptionId, Long coursId, Long leconId, Integer tempsMinutes) {
        Optional<ProgressionEtudiant> optProg = progressionRepo.findByInscriptionIdAndCoursId(inscriptionId, coursId);
        if (!optProg.isPresent()) {
            throw new RuntimeException("Progression non trouvée");
        }
        
        ProgressionEtudiant prog = optProg.get();
        prog.marquerLeconCompletee(leconId);
        if (tempsMinutes != null && tempsMinutes > 0) {
            Integer currentTime = prog.getTempsPasseMinutes();
            prog.setTempsPasseMinutes((currentTime != null ? currentTime : 0) + tempsMinutes);
        }
        progressionRepo.save(prog);

        return Map.of(
            "message", "Leçon marquée comme complétée",
            "pourcentage", prog.getPourcentageCompletion() != null ? prog.getPourcentageCompletion() : 0,
            		"coursComplete", prog.isCoursComplete()
        );
    }

    // ══════════════════════════════════════════
    // 7. Utilitaires
    // ══════════════════════════════════════════

    private String getCurrentAcademicYear() {
        int year = LocalDate.now().getYear();
        return year + "-" + (year + 1);
    }
}