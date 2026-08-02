package cd.genuc.controller;

import cd.genuc.model.Utilisateur;
import cd.genuc.service.ControleAcademiqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôle académique : supervision par le chef de département / doyen de la remise des
 * notes, du taux de présence et de la progression des cours.
 * Consommé par ControleAcademique.jsx (rôle chef).
 */
@RestController
@RequestMapping("/api/controle")
@RequiredArgsConstructor
public class ControleAcademiqueController {

    private final ControleAcademiqueService controleService;

    @GetMapping("/cours")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT', 'DOYEN', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> listerCours(@RequestParam Long departementId) {
        try {
            return ResponseEntity.ok(controleService.listerCoursParDepartement(departementId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/cours/{id}/valider")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT', 'DOYEN', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> valider(@PathVariable Long id, @AuthenticationPrincipal Utilisateur utilisateur) {
        try {
            controleService.valider(id, utilisateur != null ? utilisateur.getId() : null);
            return ResponseEntity.ok(Map.of("message", "Cours validé avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/cours/{id}/retourner")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT', 'DOYEN', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> retourner(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String motif = body.get("motif") != null ? body.get("motif").toString() : null;
            controleService.retourner(id, motif);
            return ResponseEntity.ok(Map.of("message", "Cours retourné au professeur"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/cours/{id}/correction")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT', 'DOYEN', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> demanderCorrection(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String commentaire = body.get("commentaire") != null ? body.get("commentaire").toString() : null;
            controleService.demanderCorrection(id, commentaire);
            return ResponseEntity.ok(Map.of("message", "Demande de correction envoyée"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
