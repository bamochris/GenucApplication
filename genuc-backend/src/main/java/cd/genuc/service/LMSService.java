package cd.genuc.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * LMS — Learning Management System intégré à GENUC.
 * Gère chapitres, quiz, devoirs et progression des étudiants.
 * En production, les entités LMS sont persistées en base.
 * Les fichiers vidéo/PDF sont stockés sur S3/MinIO ou le filesystem.
 */
@Service
@RequiredArgsConstructor
public class LMSService {

    public List<Map<String, Object>> getChapitres(Long coursId) {
        return new ArrayList<>();
    }

    public Map<String, Object> ajouterChapitre(Long coursId, String titre, String description, int ordre, MultipartFile fichier) {
        Map<String, Object> chapitre = new HashMap<>();
        chapitre.put("id", System.currentTimeMillis());
        chapitre.put("coursId", coursId);
        chapitre.put("titre", titre);
        chapitre.put("description", description);
        chapitre.put("ordre", ordre);
        chapitre.put("fichierUrl", fichier != null ? "/uploads/lms/" + fichier.getOriginalFilename() : null);
        chapitre.put("nomFichier", fichier != null ? fichier.getOriginalFilename() : null);
        chapitre.put("type", fichier != null ? detecterType(fichier.getContentType()) : "TEXTE");
        return chapitre;
    }

    public void supprimerChapitre(Long chapitreId) {
        /* En production : delete de la DB + fichier stockage */
    }

    public Map<String, Object> marquerVu(Long chapitreId) {
        return Map.of("chapitreId", chapitreId, "statut", "VU");
    }

    public List<Map<String, Object>> getQuiz(Long coursId) {
        return new ArrayList<>();
    }

    public Map<String, Object> ajouterQuestion(Long coursId, Map<String, String> body) {
        Map<String, Object> q = new HashMap<>(body);
        q.put("id", System.currentTimeMillis());
        q.put("coursId", coursId);
        return q;
    }

    public Map<String, Object> soumettreQuiz(Long coursId, Map<String, Object> body) {
        /* En production : calculer le score en comparant avec les bonnes réponses en base */
        return Map.of("score", 0, "message", "Quiz soumis avec succès");
    }

    public List<Map<String, Object>> getDevoirs(Long coursId) {
        return new ArrayList<>();
    }

    public Map<String, Object> creerDevoir(Long coursId, Map<String, Object> body) {
        Map<String, Object> devoir = new HashMap<>(body);
        devoir.put("id", System.currentTimeMillis());
        devoir.put("coursId", coursId);
        devoir.put("nbSoumissions", 0);
        return devoir;
    }

    public Map<String, Object> soumettreDevoir(Long devoirId, Long etudiantId, MultipartFile fichier) {
        return Map.of(
            "devoirId", devoirId,
            "etudiantId", etudiantId,
            "statut", "SOUMIS",
            "fichierUrl", fichier != null ? "/uploads/devoirs/" + fichier.getOriginalFilename() : null
        );
    }

    public Map<String, Object> getMaProgression(Long coursId) {
        return Map.of("coursId", coursId, "chapitresVus", Map.of());
    }

    public Map<String, Object> getStatistiques(Long coursId) {
        return Map.of(
            "coursId", coursId,
            "totalEtudiants", 0,
            "tauxCompletion", 0,
            "moyenneQuiz", 0,
            "devoirsRendus", 0,
            "totalDevoirs", 0,
            "chapitreCompletion", List.of(),
            "quizResultats", List.of(),
            "etudiants", Map.of("termines", 0, "enCours", 0, "pasCommence", 0),
            "aRisque", List.of()
        );
    }

    private String detecterType(String contentType) {
        if (contentType == null) return "DOCUMENT";
        if (contentType.startsWith("video/")) return "VIDEO";
        if (contentType.equals("application/pdf")) return "PDF";
        return "DOCUMENT";
    }
}
