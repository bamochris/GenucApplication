package cd.genuc.controller;

import cd.genuc.model.SujetTfc;
import cd.genuc.model.Tfc;
import cd.genuc.service.TfcService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tfc")
@RequiredArgsConstructor
public class TfcController {

    private final TfcService tfcService;

    // ══════════════════════════════════════════
    // Sujets
    // ══════════════════════════════════════════

    @PostMapping("/sujets")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> proposerSujet(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(tfcService.proposerSujet(body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/sujets/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<SujetTfc>> sujetsDuProfesseur(@PathVariable Long professeurId) {
        return ResponseEntity.ok(tfcService.sujetsDuProfesseur(professeurId));
    }

    @PatchMapping("/sujets/{id}/valider")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> validerSujet(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(tfcService.validerSujet(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // Encadrements
    // ══════════════════════════════════════════

    @PostMapping("/encadrements")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerEncadrement(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(tfcService.creerEncadrement(body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/encadrements/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> encadrementsDuProfesseur(@PathVariable Long professeurId) {
        return ResponseEntity.ok(tfcService.encadrementsDuProfesseur(professeurId));
    }

    @PatchMapping("/encadrements/{id}/statut")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> mettreAJourStatut(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Tfc tfc = tfcService.mettreAJourStatut(id, (String) body.get("statut"));
            return ResponseEntity.ok(Map.of("message", "Statut mis à jour", "statut", tfc.getStatut().name()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // Suivi mémoire
    // ══════════════════════════════════════════

    @GetMapping("/memoires/suivi/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> memoiresSuivi(@PathVariable Long professeurId) {
        return ResponseEntity.ok(tfcService.memoiresSuivi(professeurId));
    }

    @PostMapping("/memoires/{id}/commentaire")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> ajouterCommentaire(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            tfcService.ajouterCommentaire(id, body);
            return ResponseEntity.ok(Map.of("message", "Commentaire ajouté"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/memoires/{id}/progression")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> mettreAJourProgression(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Integer progression = Integer.valueOf(body.get("progression").toString());
            Tfc tfc = tfcService.mettreAJourProgression(id, progression);
            return ResponseEntity.ok(Map.of("message", "Progression mise à jour", "progression", tfc.getProgression()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
