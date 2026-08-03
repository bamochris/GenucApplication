package cd.genuc.controller;

import cd.genuc.model.*;
import cd.genuc.service.ComptabiliteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comptabilite")
@RequiredArgsConstructor
public class ComptabiliteController {

    private final ComptabiliteService comptabiliteService;

    // ─── COMPTES ────────────────────────────────────────────────────

    @GetMapping("/comptes/{universiteId}")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<List<CompteComptable>> getComptes(@PathVariable Long universiteId) {
        return ResponseEntity.ok(comptabiliteService.getComptes(universiteId));
    }

    @PostMapping("/comptes")
    @PreAuthorize("hasRole('COMPTABLE')")
    public ResponseEntity<?> creerCompte(@RequestBody CompteComptable compte) {
        try {
            return ResponseEntity.ok(comptabiliteService.creerCompte(compte));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/comptes/{id}")
    @PreAuthorize("hasRole('COMPTABLE')")
    public ResponseEntity<?> modifierCompte(@PathVariable Long id, @RequestBody CompteComptable compte) {
        try {
            return ResponseEntity.ok(comptabiliteService.modifierCompte(id, compte));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── ÉCRITURES ──────────────────────────────────────────────────

    @PostMapping("/ecritures")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> enregistrerEcriture(@RequestBody EcritureComptable ecriture) {
        try {
            return ResponseEntity.ok(comptabiliteService.enregistrerEcriture(ecriture));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/ecritures/{id}/valider")
    @PreAuthorize("hasRole('COMPTABLE')")
    public ResponseEntity<?> validerEcriture(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("valideurId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "valideurId est requis"));
            }
            Long valideurId = Long.valueOf(body.get("valideurId").toString());
            return ResponseEntity.ok(comptabiliteService.validerEcriture(id, valideurId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/ecritures/{universiteId}")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN_UNIVERSITE')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<?> getEcritures(@PathVariable Long universiteId,
                                          @RequestParam String debut,
                                          @RequestParam String fin) {
        try {
            LocalDate d = LocalDate.parse(debut);
            LocalDate f = LocalDate.parse(fin);
            return ResponseEntity.ok(comptabiliteService.getEcrituresParPeriode(universiteId, d, f));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Format de date invalide. Utilisez 'yyyy-MM-dd'"));
        }
    }

    // ─── BUDGET ─────────────────────────────────────────────────────

    @GetMapping("/budgets/{universiteId}/{annee}")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN_UNIVERSITE')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<List<Budget>> getBudgets(@PathVariable Long universiteId,
                                                   @PathVariable Integer annee) {
        return ResponseEntity.ok(comptabiliteService.getBudgets(universiteId, annee));
    }

    @PostMapping("/budgets")
    @PreAuthorize("hasRole('COMPTABLE')")
    public ResponseEntity<?> creerBudget(@RequestBody Budget budget) {
        try {
            return ResponseEntity.ok(comptabiliteService.creerBudget(budget));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── RAPPORTS ──────────────────────────────────────────────────

    @GetMapping("/balance/{universiteId}")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<?> getBalance(@PathVariable Long universiteId,
                                        @RequestParam(defaultValue = "#{T(java.time.LocalDate).now()}") String date) {
        try {
            LocalDate d = LocalDate.parse(date);
            return ResponseEntity.ok(comptabiliteService.getBalance(universiteId, d));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Format de date invalide. Utilisez 'yyyy-MM-dd'"));
        }
    }

    // ─── Gestionnaire d'exceptions global (optionnel) ──────────────

    // NOTE: Il est préférable de déplacer ce gestionnaire dans un @ControllerAdvice global.
    // Supprimé pour éviter les conflits.
}
