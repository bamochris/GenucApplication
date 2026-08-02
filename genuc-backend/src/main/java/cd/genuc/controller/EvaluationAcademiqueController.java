package cd.genuc.controller;

import cd.genuc.service.EvaluationAcademiqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API REST — Module Évaluations du professeur (Examens / Interrogations / TP-TD).
 *
 * Planification et pondération des évaluations d'un cours. La saisie des notes
 * elles-mêmes reste gérée par {@code NoteController} (/api/notes) — voir
 * {@link EvaluationAcademiqueService} pour le détail.
 *
 * NB : le préfixe /api/evaluations est également utilisé par
 * {@link EvaluationEnseignantController} pour un tout autre sujet (évaluation
 * du professeur PAR les étudiants) — les sous-chemins ne se recoupent pas.
 */
@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationAcademiqueController {

    private final EvaluationAcademiqueService evaluationService;

    private static final String ROLES_GESTION =
        "hasAnyRole('PROFESSEUR','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')";

    // ══════════════════════════════════════════
    // EXAMENS
    // ══════════════════════════════════════════

    @GetMapping("/examens/{professeurId}")
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> listerExamens(@PathVariable Long professeurId) {
        return ResponseEntity.ok(evaluationService.listerExamens(professeurId));
    }

    @PostMapping("/examens")
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> creerExamen(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(evaluationService.creerExamen(body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // INTERROGATIONS
    // ══════════════════════════════════════════

    @GetMapping("/interrogations/{professeurId}")
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> listerInterrogations(@PathVariable Long professeurId) {
        return ResponseEntity.ok(evaluationService.listerInterrogations(professeurId));
    }

    @PostMapping("/interrogations")
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> creerInterrogation(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(evaluationService.creerInterrogation(body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // TRAVAUX PRATIQUES / DIRIGÉS
    // ══════════════════════════════════════════

    @GetMapping("/tp/{professeurId}")
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> listerTp(@PathVariable Long professeurId) {
        return ResponseEntity.ok(evaluationService.listerTp(professeurId));
    }

    @PostMapping("/tp")
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> creerTp(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(evaluationService.creerTp(body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
