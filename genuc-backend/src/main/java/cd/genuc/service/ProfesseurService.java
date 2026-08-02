package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Agrège les données déjà existantes (cours, horaires, présences, notes,
 * inscriptions) pour alimenter le tableau de bord du professeur. N'invente
 * aucune donnée : chaque statistique provient d'un repository réel.
 */
@Service
@RequiredArgsConstructor
public class ProfesseurService {

    private final CoursRepository coursRepo;
    private final HoraireRepository horaireRepo;
    private final PresenceRepository presenceRepo;
    private final NoteRepository noteRepo;
    private final InscriptionRepository inscriptionRepo;

    private static final DateTimeFormatter HEURE = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ══════════════════════════════════════════
    // COURS ACTIFS / ÉTUDIANTS
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<Cours> coursActifs(Long professeurId) {
        return coursRepo.findByProfesseurId(professeurId).stream()
                .filter(c -> c.getStatut() != Cours.StatutCours.ARCHIVE)
                .toList();
    }

    /** Étudiants distincts (via les promotions rattachées aux cours du professeur). */
    private Set<Long> etudiantsDistincts(List<Cours> coursList) {
        Set<Long> ids = new HashSet<>();
        for (Cours c : coursList) {
            if (c.getPromotion() != null) {
                inscriptionRepo.findByPromotionId(c.getPromotion().getId()).stream()
                        .filter(i -> i.getStatut() == StatutInscription.VALIDE)
                        .forEach(i -> ids.add(i.getId()));
            }
        }
        return ids;
    }

    private long nbEtudiantsCours(Cours cours) {
        if (cours.getPromotion() == null) return 0;
        return inscriptionRepo.findByPromotionId(cours.getPromotion().getId()).stream()
                .filter(i -> i.getStatut() == StatutInscription.VALIDE)
                .count();
    }

    // ══════════════════════════════════════════
    // GET /api/professeur/stats/{professeurId}
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public Map<String, Object> stats(Long professeurId) {
        List<Cours> mesCours = coursActifs(professeurId);
        long coursAujourdhui = horaireRepo
                .findByProfesseurIdAndJour(professeurId, LocalDate.now().getDayOfWeek())
                .size();

        long totalEtudiants = etudiantsDistincts(mesCours).size();

        long totalPresences = presenceRepo.countByProfesseurId(professeurId);
        long presencesPresent = presenceRepo.countPresentByProfesseurId(professeurId);
        long tauxPresence = totalPresences > 0
                ? Math.round((presencesPresent * 100.0) / totalPresences) : 0;

        long notesACorriger = noteRepo.countByProfesseurIdAndStatut(professeurId, Note.StatutNote.EN_COURS);
        long notesEnAttente = noteRepo.countByProfesseurIdAndStatut(professeurId, Note.StatutNote.SOUMISE);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalCours", mesCours.size());
        m.put("coursAujourdhui", coursAujourdhui);
        m.put("totalEtudiants", totalEtudiants);
        m.put("tauxPresence", tauxPresence);
        m.put("notesACorriger", notesACorriger);
        m.put("notesEnAttente", notesEnAttente);
        return m;
    }

    // ══════════════════════════════════════════
    // GET /api/professeur/presences/{professeurId}
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public Map<String, Object> presencesSummary(Long professeurId) {
        long total = presenceRepo.countByProfesseurId(professeurId);
        long present = presenceRepo.countPresentByProfesseurId(professeurId);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("total", total);
        m.put("presents", present);
        m.put("tauxPresence", total > 0 ? Math.round((present * 100.0) / total) : 0);
        return m;
    }

    // ══════════════════════════════════════════
    // GET /api/professeur/schedule/today/{professeurId}
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<Map<String, Object>> scheduleAujourdhui(Long professeurId) {
        DayOfWeek aujourdhui = LocalDate.now().getDayOfWeek();
        LocalTime maintenant = LocalTime.now();

        return horaireRepo.findByProfesseurIdAndJour(professeurId, aujourdhui).stream()
                .map(h -> {
                    String statut;
                    if (h.getHeureFin() != null && maintenant.isAfter(h.getHeureFin())) {
                        statut = "done";
                    } else if (h.getHeureDebut() != null && h.getHeureFin() != null
                            && !maintenant.isBefore(h.getHeureDebut()) && maintenant.isBefore(h.getHeureFin())) {
                        statut = "active";
                    } else {
                        statut = "upcoming";
                    }

                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", h.getId());
                    m.put("titre", h.getCours() != null ? h.getCours().getTitre() : "Cours");
                    m.put("heureDebut", h.getHeureDebut() != null ? h.getHeureDebut().format(HEURE) : null);
                    m.put("heureFin", h.getHeureFin() != null ? h.getHeureFin().format(HEURE) : null);
                    m.put("salle", h.getSalle() != null ? h.getSalle().getNom() : "");
                    m.put("nbEtudiants", h.getCours() != null ? nbEtudiantsCours(h.getCours()) : 0);
                    m.put("statut", statut);
                    return m;
                })
                .toList();
    }

    // ══════════════════════════════════════════
    // GET /api/professeur/alertes/{professeurId}
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<Map<String, Object>> alertes(Long professeurId) {
        List<Map<String, Object>> alertes = new ArrayList<>();
        String aujourdhuiStr = LocalDate.now().format(DATE_FR);

        // Notes soumises en attente de validation par le chef de département
        long notesEnAttente = noteRepo.countByProfesseurIdAndStatut(professeurId, Note.StatutNote.SOUMISE);
        if (notesEnAttente > 0) {
            alertes.add(alerte("info", "Notes en attente de validation",
                    notesEnAttente + " note(s) soumise(s) en attente de validation par le chef de département.",
                    aujourdhuiStr, "/professeur/notes/historique", "Voir"));
        }

        // Présences non saisies pour les cours d'aujourd'hui déjà terminés
        LocalDate today = LocalDate.now();
        LocalTime maintenant = LocalTime.now();
        List<Horaire> horairesAujourdhui = horaireRepo.findByProfesseurIdAndJour(professeurId, today.getDayOfWeek());
        for (Horaire h : horairesAujourdhui) {
            if (h.getHeureFin() == null || !maintenant.isAfter(h.getHeureFin()) || h.getCours() == null) continue;
            boolean presencesPrises = !presenceRepo.findByCoursIdAndDateCours(h.getCours().getId(), today).isEmpty();
            if (!presencesPrises) {
                alertes.add(alerte("warning", "Présences non saisies",
                        "Aucune présence enregistrée pour \"" + h.getCours().getTitre() + "\" aujourd'hui.",
                        aujourdhuiStr, "/professeur/presences/saisie", "Saisir"));
            }
        }

        // Cours encore en brouillon (non publiés)
        List<Cours> brouillons = coursRepo.findByProfesseurId(professeurId).stream()
                .filter(c -> c.getStatut() == Cours.StatutCours.BROUILLON)
                .limit(5)
                .toList();
        for (Cours c : brouillons) {
            alertes.add(alerte("info", "Cours non publié",
                    "\"" + c.getTitre() + "\" est encore en brouillon.",
                    aujourdhuiStr, "/professeur/mes-cours", "Publier"));
        }

        return alertes;
    }

    private Map<String, Object> alerte(String type, String titre, String message, String date, String lien, String action) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", type);
        m.put("titre", titre);
        m.put("message", message);
        m.put("date", date);
        m.put("lien", lien);
        m.put("action", action);
        return m;
    }
}
