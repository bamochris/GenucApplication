package cd.genuc.controller;

import cd.genuc.model.Alerte;
import cd.genuc.model.Alerte.NiveauAlerte;
import cd.genuc.model.Alerte.CategorieAlerte;
import cd.genuc.service.AlerteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alertes")
@RequiredArgsConstructor
public class AlerteController {

    private final AlerteService alerteService;

    @GetMapping("/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Alerte>> getAlertes(@PathVariable Long universiteId) {
        return ResponseEntity.ok(alerteService.getAlertesParUniversite(universiteId));
    }

    @GetMapping("/universite/{universiteId}/non-vues")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Alerte>> getAlertesNonVues(@PathVariable Long universiteId) {
        return ResponseEntity.ok(alerteService.getAlertesNonVuesParUniversite(universiteId));
    }

    @GetMapping("/critiques")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Alerte>> getAlertesCritiques() {
        return ResponseEntity.ok(alerteService.getAlertesCritiquesNonVues());
    }

    @GetMapping("/universite/{universiteId}/count")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Long>> countNonVues(@PathVariable Long universiteId) {
        return ResponseEntity.ok(Map.of(
                "nonVues", alerteService.countNonVues(universiteId),
                "critiques", alerteService.countNonVuesCritiques()
        ));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> creerAlerte(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("message") || !body.containsKey("niveau") || !body.containsKey("categorie")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "message, niveau et categorie sont requis"));
            }
            Alerte alerte = alerteService.creerAlerte(
                    (String) body.get("message"),
                    NiveauAlerte.valueOf((String) body.get("niveau")),
                    CategorieAlerte.valueOf((String) body.get("categorie")),
                    body.containsKey("universiteId") ? Long.valueOf(body.get("universiteId").toString()) : null
            );
            return ResponseEntity.ok(alerte);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/vue")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> marquerVue(@PathVariable Long id) {
        alerteService.marquerVue(id);
        return ResponseEntity.ok(Map.of("message", "Alerte marquée comme vue"));
    }

    @PatchMapping("/universite/{universiteId}/tout-vu")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> marquerToutesVues(@PathVariable Long universiteId) {
        alerteService.marquerToutesVues(universiteId);
        return ResponseEntity.ok(Map.of("message", "Toutes les alertes marquées comme vues"));
    }
}