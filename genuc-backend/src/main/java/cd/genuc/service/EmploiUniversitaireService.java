package cd.genuc.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service Emploi Étudiant Universitaire.
 *
 * Permet aux étudiants de travailler au sein de leur université pendant leur cursus.
 * Catégories : moniteur, labo, biblio, it, admin, culture, securite, maintenance.
 *
 * Flux : Offre publiée par RH → Étudiant postule → RH accepte/rejette →
 *        Contrat signé → Pointage quotidien → Calcul salaire mensuel.
 */
@Service
@RequiredArgsConstructor
public class EmploiUniversitaireService {

    private final CacheService cacheService;

    /* ── Offres ── */

    public List<Map<String, Object>> getOffresPubliques(Long universiteId, String categorie, int page, int size) {
        /* En production : requête JPA avec filtres + pagination */
        return new ArrayList<>();
    }

    public Map<String, Object> getDetailOffre(Long id) {
        return Map.of("id", id, "message", "Offre non trouvée");
    }

    public Map<String, Object> creerOffre(Map<String, Object> body) {
        Map<String, Object> offre = new HashMap<>(body);
        offre.put("id", System.currentTimeMillis());
        offre.put("statut", "ACTIVE");
        offre.put("datePublication", LocalDate.now().toString());
        offre.put("nbCandidatures", 0);
        return offre;
    }

    public Map<String, Object> modifierOffre(Long id, Map<String, Object> body) {
        body.put("id", id);
        body.put("modifieLe", LocalDateTime.now().toString());
        return body;
    }

    public void supprimerOffre(Long id) {
        /* En production : soft delete */
    }

    public List<Map<String, Object>> getOffresAdmin(Long universiteId) {
        return new ArrayList<>();
    }

    /* ── Candidatures ── */

    public Map<String, Object> postuler(Long offreId, Long etudiantId, String motivation, MultipartFile cv) {
        /* Vérifications métier :
         * 1. L'étudiant n'a pas déjà postulé à cette offre
         * 2. L'étudiant est inscrit dans l'université de l'offre
         * 3. Moyenne ≥ 12/20
         * 4. Pas de dette de frais
         */
        Map<String, Object> candidature = new HashMap<>();
        candidature.put("id", System.currentTimeMillis());
        candidature.put("offreId", offreId);
        candidature.put("etudiantId", etudiantId);
        candidature.put("motivation", motivation);
        candidature.put("cvUrl", cv != null ? "/uploads/cv/" + cv.getOriginalFilename() : null);
        candidature.put("statut", "EN_ATTENTE");
        candidature.put("dateCandidature", LocalDate.now().toString());
        return candidature;
    }

    public List<Map<String, Object>> getMesCandidatures(Long etudiantId) {
        return new ArrayList<>();
    }

    public List<Map<String, Object>> getMesContrats(Long etudiantId) {
        return new ArrayList<>();
    }

    public Map<String, Object> getMesHeures(Long etudiantId, String mois) {
        return Map.of(
            "etudiantId", etudiantId,
            "mois", mois != null ? mois : LocalDate.now().toString().substring(0, 7),
            "totalHeures", 0,
            "salaireDu", 0,
            "devise", "USD",
            "pointages", List.of()
        );
    }

    public List<Map<String, Object>> getCandidaturesOffre(Long offreId) {
        return new ArrayList<>();
    }

    public Map<String, Object> traiterCandidature(Long candidatureId, String decision, String message) {
        /* En production :
         * - Si ACCEPTEE : créer un contrat, envoyer notification WhatsApp/email
         * - Si REJETEE : envoyer notification avec motif
         */
        return Map.of(
            "candidatureId", candidatureId,
            "decision", decision,
            "message", message,
            "traiteLe", LocalDateTime.now().toString()
        );
    }

    /* ── Pointage & Salaires ── */

    public Map<String, Object> enregistrerPointage(Map<String, Object> body) {
        /* En production : enregistrement arrivée/départ, calcul heures effectuées */
        return Map.of(
            "message", "Pointage enregistré",
            "heures", body.getOrDefault("heures", 0),
            "dateLe", LocalDate.now().toString()
        );
    }

    public Map<String, Object> getRapportSalaires(String mois, Long universiteId) {
        /* En production : agrégation des heures × taux horaire par étudiant-employé */
        return Map.of(
            "mois", mois,
            "totalEtudiantsEmployes", 0,
            "totalSalairesUSD", 0.0,
            "totalSalairesCDF", 0.0,
            "details", List.of()
        );
    }

    /* ── Stats publiques (pour la page d'accueil emploi) ── */

    public Map<String, Object> getStatsPubliques() {
        return Map.of(
            "postes", 0,
            "etudiantsEmployes", 0,
            "universites", 0,
            "categories", 8
        );
    }
}
