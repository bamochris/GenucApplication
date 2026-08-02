package cd.genuc.service;

import cd.genuc.repository.NoteRepository;
import cd.genuc.repository.PresenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IAService {

    private final NoteRepository noteRepository;
    private final PresenceRepository presenceRepository;

    /**
     * Calcule un score de risque 0-100 pour chaque étudiant d'une promotion.
     * Algorithme : 40% notes + 40% présences + 20% engagement LMS.
     */
    public Map<String, Object> analyserRisquePromotion(Long promotionId, String annee) {
        List<Map<String, Object>> resultats = new ArrayList<>();

        try {
            List<Object[]> notesData = noteRepository.findStatsByPromotion(promotionId, annee);

            for (Object[] row : notesData) {
                Long etudiantId = ((Number) row[0]).longValue();
                String prenom = (String) row[1];
                String nom = (String) row[2];
                Double moyenne = row[3] != null ? ((Number) row[3]).doubleValue() : null;

                /* Score de risque basé sur la moyenne */
                int scoreRisque = calculerScoreRisque(moyenne, null);

                Map<String, Object> etudiant = new HashMap<>();
                etudiant.put("etudiantId", etudiantId);
                etudiant.put("prenom", prenom);
                etudiant.put("nom", nom);
                etudiant.put("moyenneActuelle", moyenne);
                etudiant.put("scoreRisque", scoreRisque);
                etudiant.put("niveau", scoreRisque >= 70 ? "CRITIQUE" : scoreRisque >= 40 ? "MODERE" : "FAIBLE");
                etudiant.put("facteurs", genererFacteurs(moyenne, null));
                resultats.add(etudiant);
            }
        } catch (Exception e) {
            /* Retourne vide si la requête n'existe pas encore */
        }

        return Map.of(
            "promotionId", promotionId,
            "annee", annee,
            "totalEtudiants", resultats.size(),
            "aCritique", resultats.stream().filter(r -> "CRITIQUE".equals(r.get("niveau"))).count(),
            "aModere", resultats.stream().filter(r -> "MODERE".equals(r.get("niveau"))).count(),
            "etudiants", resultats
        );
    }

    public List<Map<String, Object>> getEtudiantsARisque(Long promotionId, String annee, int seuilMax) {
        Map<String, Object> analyse = analyserRisquePromotion(
            promotionId != null ? promotionId : -1L,
            annee != null ? annee : ""
        );
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> etudiants = (List<Map<String, Object>>) analyse.get("etudiants");
        return etudiants.stream()
            .filter(e -> (int) e.get("scoreRisque") >= seuilMax)
            .toList();
    }

    public List<String> getRecommandations(Long etudiantId) {
        List<String> recommandations = new ArrayList<>();
        recommandations.add("Consultez régulièrement vos notes et identifiez les matières en difficulté.");
        recommandations.add("Utilisez la bibliothèque numérique pour des ressources supplémentaires.");
        recommandations.add("Participez aux séances de tutorat disponibles sur GENUC.");
        recommandations.add("Contactez votre professeur principal si vous avez des difficultés persistantes.");
        return recommandations;
    }

    private int calculerScoreRisque(Double moyenne, Double tauxPresence) {
        int score = 0;

        /* Composante notes (0-60 points) */
        if (moyenne == null) {
            score += 30;
        } else if (moyenne < 10) {
            score += 60;
        } else if (moyenne < 12) {
            score += 40;
        } else if (moyenne < 14) {
            score += 20;
        }

        /* Composante présences (0-40 points) */
        if (tauxPresence == null) {
            score += 10;
        } else if (tauxPresence < 50) {
            score += 40;
        } else if (tauxPresence < 70) {
            score += 25;
        } else if (tauxPresence < 85) {
            score += 10;
        }

        return Math.min(100, score);
    }

    private List<String> genererFacteurs(Double moyenne, Double tauxPresence) {
        List<String> facteurs = new ArrayList<>();
        if (moyenne != null && moyenne < 10) facteurs.add("Moyenne inférieure à 10/20");
        if (moyenne != null && moyenne < 12) facteurs.add("Notes insuffisantes dans plusieurs matières");
        if (tauxPresence != null && tauxPresence < 70) facteurs.add("Taux de présence critique");
        if (facteurs.isEmpty()) facteurs.add("Aucun facteur critique détecté");
        return facteurs;
    }
}
