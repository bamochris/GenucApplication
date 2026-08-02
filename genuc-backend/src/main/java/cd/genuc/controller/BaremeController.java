package cd.genuc.controller;

import cd.genuc.model.BaremeEvaluation;
import cd.genuc.service.BaremeEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API REST — Barèmes de notation (pondération TP/Interrogation/Examen + échelle de mentions).
 * Utilisé par le module Évaluations du professeur, et consommé par le module Notes
 * (CalculsNotes) pour appliquer la pondération réelle d'un cours au lieu du 30/20/50 par défaut.
 */
@RestController
@RequestMapping("/api/baremes")
@RequiredArgsConstructor
public class BaremeController {

    private final BaremeEvaluationService baremeService;

    private static final String ROLES_GESTION =
        "hasAnyRole('PROFESSEUR','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')";

    @GetMapping("/professeur/{professeurId}")
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> listerParProfesseur(@PathVariable Long professeurId) {
        return ResponseEntity.ok(baremeService.listerParProfesseur(professeurId));
    }

    /** Barème effectif d'un cours — utilisé par le calcul automatique des notes. */
    @GetMapping("/cours/{coursId}")
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> obtenirPourCours(@PathVariable Long coursId) {
        return baremeService.obtenirPourCours(coursId)
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}")
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> obtenir(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(baremeService.obtenir(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> creer(@RequestBody Map<String, Object> body) {
        try {
            BaremeEvaluation bareme = baremeService.creer(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(bareme);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> modifier(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(baremeService.modifier(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(ROLES_GESTION)
    public ResponseEntity<?> supprimer(@PathVariable Long id) {
        try {
            baremeService.supprimer(id);
            return ResponseEntity.ok(Map.of("message", "Barème supprimé"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
