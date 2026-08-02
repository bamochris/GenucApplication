package cd.genuc.controller;

import cd.genuc.service.ProfesseurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API REST — Tableau de bord professeur (GENUC).
 * Agrège des données déjà existantes (cours, horaires, présences, notes,
 * inscriptions) : aucune donnée n'est inventée, voir {@link ProfesseurService}.
 */
@RestController
@RequestMapping("/api/professeur")
@RequiredArgsConstructor
public class ProfesseurController {

    private final ProfesseurService professeurService;

    @GetMapping("/stats/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> stats(@PathVariable Long professeurId) {
        return ResponseEntity.ok(professeurService.stats(professeurId));
    }

    @GetMapping("/presences/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> presences(@PathVariable Long professeurId) {
        return ResponseEntity.ok(professeurService.presencesSummary(professeurId));
    }

    @GetMapping("/schedule/today/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> scheduleToday(@PathVariable Long professeurId) {
        return ResponseEntity.ok(professeurService.scheduleAujourdhui(professeurId));
    }

    @GetMapping("/alertes/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> alertes(@PathVariable Long professeurId) {
        return ResponseEntity.ok(professeurService.alertes(professeurId));
    }
}
