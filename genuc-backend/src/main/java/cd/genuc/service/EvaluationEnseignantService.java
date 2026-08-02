package cd.genuc.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EvaluationEnseignantService {

    private final CacheService cacheService;

    public Map<String, Object> soumettre(Long coursId, Map<String, Integer> criteres, String commentaire) {
        /* En production : persist dans une table anonymisée avec hash de l'etudiantId */
        double noteGlobale = criteres.values().stream().mapToInt(Integer::intValue).average().orElse(0);
        return Map.of(
            "coursId", coursId,
            "noteGlobale", Math.round(noteGlobale * 10.0) / 10.0,
            "statut", "SOUMISE",
            "message", "Évaluation enregistrée anonymement"
        );
    }

    public List<Map<String, Object>> getMesEvaluations() {
        /* Retourne les cours évalués par l'étudiant connecté (sans détail) */
        return List.of();
    }

    public Map<String, Object> getEvaluationProfesseur(Long professeurId) {
        /* Agrégation des évaluations d'un professeur */
        Map<String, Object> result = new HashMap<>();
        result.put("professeurId", professeurId);
        result.put("nbEvaluations", 0);
        result.put("noteGlobale", 0.0);
        result.put("moyennes", Map.of(
            "clarte", 0.0, "ponctualite", 0.0,
            "disponibilite", 0.0, "maitrise", 0.0, "methode", 0.0
        ));
        result.put("commentaires", List.of());
        result.put("nbCours", 0);
        result.put("pctRecommande", 0);
        return result;
    }

    public List<Map<String, Object>> getSyntheseAdmin() {
        /* Liste tous les professeurs avec leurs moyennes agrégées */
        return new ArrayList<>();
    }
}
