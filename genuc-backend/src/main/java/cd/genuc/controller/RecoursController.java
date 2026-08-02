package cd.genuc.controller;

import cd.genuc.model.Recours;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.RecoursService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Recours académiques (contestation de note / matricule / cours manquant, etc.).
 *
 * Réconcilie les deux surfaces frontend existantes :
 *  - RecoursAcademiques.jsx (étudiant)   → /api/etudiant/{userId}/recours, /api/etudiant/{userId}/cours
 *  - GestionRecours.jsx (admin)          → /api/admin/recours
 *  - deliberationService.js (legacy)     → /api/deliberation/recours/**
 */
@RestController
@RequiredArgsConstructor
public class RecoursController {

    private final RecoursService recoursService;

    // ─────────────────────────────────────────────
    // ÉTUDIANT — RecoursAcademiques.jsx
    // ─────────────────────────────────────────────

    @GetMapping("/api/etudiant/{userId}/cours")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> mesCoursPourRecours(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(recoursService.listerCoursEtudiant(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/api/etudiant/{userId}/recours")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> mesRecours(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(recoursService.listerRecoursEtudiant(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping(value = "/api/etudiant/{userId}/recours", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> soumettreRecours(@PathVariable Long userId,
                                              @RequestParam String type,
                                              @RequestParam String description,
                                              @RequestParam(required = false) Long coursId,
                                              @RequestParam(required = false) String anneeAcademique,
                                              @RequestParam(required = false) MultipartFile pieceJointe) {
        try {
            Recours recours = recoursService.soumettre(userId, type, description, coursId, anneeAcademique, pieceJointe);
            return ResponseEntity.ok(Map.of(
                    "message", "Recours soumis avec succès",
                    "id", recours.getId(),
                    "statut", recours.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // ADMIN / CHEF DE DÉPARTEMENT — GestionRecours.jsx
    // ─────────────────────────────────────────────

    @GetMapping("/api/admin/recours")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'RECTEUR', 'DOYEN', 'CHEF_DEPARTEMENT', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> listerRecoursAdmin(@RequestParam(required = false) Long universiteId,
                                                @RequestParam(required = false) Long departementId,
                                                @RequestParam(required = false) String statut) {
        try {
            return ResponseEntity.ok(recoursService.listerPourAdmin(universiteId, departementId, statut));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/api/admin/recours/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'RECTEUR', 'DOYEN', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<?> traiterRecoursAdmin(@PathVariable Long id,
                                                 @RequestBody Map<String, Object> body,
                                                 @AuthenticationPrincipal Utilisateur utilisateur) {
        try {
            String statut = String.valueOf(body.get("statut"));
            String commentaire = body.get("commentaire") != null ? body.get("commentaire").toString() : null;
            Long traiteParId = utilisateur != null ? utilisateur.getId() : null;
            Recours recours = recoursService.traiter(id, statut, commentaire, traiteParId);
            return ResponseEntity.ok(Map.of(
                    "message", "Recours traité",
                    "id", recours.getId(),
                    "statut", recours.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // Alias legacy — deliberationService.js (/api/deliberation/recours/**)
    // ─────────────────────────────────────────────

    @GetMapping("/api/deliberation/recours/etudiant/{userId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getRecoursEtudiantLegacy(@PathVariable Long userId) {
        return mesRecours(userId);
    }

    @PostMapping(value = "/api/deliberation/recours/etudiant/{userId}", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> soumettreRecoursLegacy(@PathVariable Long userId,
                                                     @RequestParam String type,
                                                     @RequestParam String description,
                                                     @RequestParam(required = false) Long coursId,
                                                     @RequestParam(required = false) String annee,
                                                     @RequestParam(required = false) MultipartFile pieceJointe) {
        return soumettreRecours(userId, type, description, coursId, annee, pieceJointe);
    }

    @PutMapping("/api/deliberation/recours/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'RECTEUR', 'DOYEN', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<?> traiterRecoursLegacy(@PathVariable Long id,
                                                  @RequestBody Map<String, Object> body,
                                                  @AuthenticationPrincipal Utilisateur utilisateur) {
        try {
            Object decision = body.containsKey("decision") ? body.get("decision") : body.get("statut");
            String commentaire = body.get("commentaire") != null ? body.get("commentaire").toString() : null;
            Long traiteParId = utilisateur != null ? utilisateur.getId() : null;
            Recours recours = recoursService.traiter(id, String.valueOf(decision), commentaire, traiteParId);
            return ResponseEntity.ok(Map.of(
                    "message", "Recours traité",
                    "id", recours.getId(),
                    "statut", recours.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/api/deliberation/recours/admin")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'RECTEUR', 'DOYEN', 'CHEF_DEPARTEMENT', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> listerRecoursAdminLegacy(@RequestParam(required = false) Long universiteId,
                                                       @RequestParam(required = false) String statut) {
        return listerRecoursAdmin(universiteId, null, statut);
    }
}
