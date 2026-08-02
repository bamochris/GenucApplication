package cd.genuc.controller;

import cd.genuc.service.EvaluationEnseignantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationEnseignantController {

    private final EvaluationEnseignantService evaluationService;

    /** Soumettre une évaluation anonyme */
    @PostMapping("/soumettre")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> soumettre(@RequestBody Map<String, Object> body) {
        Long coursId = Long.valueOf(body.get("coursId").toString());
        Map<String, Integer> criteres = Map.of(
            "clarte", Integer.valueOf(body.getOrDefault("clarte", 0).toString()),
            "ponctualite", Integer.valueOf(body.getOrDefault("ponctualite", 0).toString()),
            "disponibilite", Integer.valueOf(body.getOrDefault("disponibilite", 0).toString()),
            "maitrise", Integer.valueOf(body.getOrDefault("maitrise", 0).toString()),
            "methode", Integer.valueOf(body.getOrDefault("methode", 0).toString())
        );
        String commentaire = (String) body.getOrDefault("commentaire", "");
        return ResponseEntity.ok(evaluationService.soumettre(coursId, criteres, commentaire));
    }

    /** Évaluations déjà soumises par l'étudiant connecté */
    @GetMapping("/mes-evaluations")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> mesEvaluations() {
        return ResponseEntity.ok(evaluationService.getMesEvaluations());
    }

    /** Résultats agrégés pour un professeur */
    @GetMapping("/professeur/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR','ADMIN_UNIVERSITE','SUPER_ADMIN','RH','RECTEUR')")
    public ResponseEntity<?> evaluationProfesseur(@PathVariable Long professeurId) {
        return ResponseEntity.ok(evaluationService.getEvaluationProfesseur(professeurId));
    }

    /** Synthèse de tous les professeurs pour l'admin */
    @GetMapping("/admin/synthese")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','RH','RECTEUR')")
    public ResponseEntity<?> syntheseAdmin() {
        return ResponseEntity.ok(evaluationService.getSyntheseAdmin());
    }
}
