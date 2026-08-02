package cd.genuc.controller;

import cd.genuc.model.OffreStage;
import cd.genuc.model.Stage;
import cd.genuc.service.StageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stages")
@RequiredArgsConstructor
public class StageController {

    private final StageService stageService;

    // ══════════════════════════════════════════
    // Validation des stages (professeur)
    // ══════════════════════════════════════════

    @GetMapping("/validation/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> stagesPourValidation(@PathVariable Long professeurId) {
        return ResponseEntity.ok(stageService.stagesPourValidation(professeurId));
    }

    @PatchMapping("/{id}/valider")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> validerStage(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long valideParId = body.get("valideParId") != null ? Long.valueOf(body.get("valideParId").toString()) : null;
            Stage stage = stageService.validerStage(id, valideParId);
            return ResponseEntity.ok(Map.of("message", "Stage validé", "statut", stage.getStatut().name()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/rejeter")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> rejeterStage(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long valideParId = body.get("valideParId") != null ? Long.valueOf(body.get("valideParId").toString()) : null;
            String motif = (String) body.getOrDefault("motif", "Non spécifié");
            Stage stage = stageService.rejeterStage(id, motif, valideParId);
            return ResponseEntity.ok(Map.of("message", "Stage rejeté", "statut", stage.getStatut().name()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // Suivi des stages (professeur)
    // ══════════════════════════════════════════

    @GetMapping("/suivi/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> stagesEnSuivi(@PathVariable Long professeurId) {
        return ResponseEntity.ok(stageService.stagesEnSuivi(professeurId));
    }

    @GetMapping("/{stageId}/rapport")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> rapportDuStage(@PathVariable Long stageId) {
        try {
            return ResponseEntity.ok(stageService.rapportDuStage(stageId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{stageId}/rapport/valider")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> validerRapport(@PathVariable Long stageId, @RequestBody Map<String, Object> body) {
        try {
            Long valideParId = body.get("valideParId") != null ? Long.valueOf(body.get("valideParId").toString()) : null;
            String avis = (String) body.get("avis");
            stageService.validerRapport(stageId, avis, valideParId);
            return ResponseEntity.ok(Map.of("message", "Rapport validé"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // Rapports de stage (professeur)
    // ══════════════════════════════════════════

    @GetMapping("/rapports/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> rapportsDisponibles(@PathVariable Long professeurId) {
        return ResponseEntity.ok(stageService.rapportsDisponibles(professeurId));
    }

    @PatchMapping("/rapports/{id}/valider")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> validerRapportDepuisListe(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long valideParId = body.get("valideParId") != null ? Long.valueOf(body.get("valideParId").toString()) : null;
            stageService.validerRapport(id, null, valideParId);
            return ResponseEntity.ok(Map.of("message", "Rapport validé"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // Offres de stage (gestion)
    // ══════════════════════════════════════════

    @PostMapping("/offres")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<?> creerOffre(@RequestBody Map<String, Object> body) {
        try {
            OffreStage offre = stageService.creerOffre(body);
            return ResponseEntity.ok(offre);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
