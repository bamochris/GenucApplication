package cd.genuc.controller;

import cd.genuc.model.RoleEnum;
import cd.genuc.model.SupportCours;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.SupportCoursService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * API REST — Supports de cours (fichiers déposés par les professeurs).
 * Les fichiers sont stockés dans S3 via {@link cd.genuc.service.S3Service},
 * comme les autres documents de la plateforme (voir DocumentController).
 */
@RestController
@RequestMapping("/api/cours")
@RequiredArgsConstructor
public class SupportCoursController {

    private final SupportCoursService supportCoursService;

    @GetMapping("/{coursId}/supports")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SupportCours>> lister(@PathVariable Long coursId) {
        return ResponseEntity.ok(supportCoursService.lister(coursId));
    }

    @PostMapping("/{coursId}/supports")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> ajouter(
            @PathVariable Long coursId,
            @RequestParam String titre,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "DOCUMENT") String type,
            @RequestParam MultipartFile fichier,
            @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            SupportCours support = supportCoursService.ajouter(
                    coursId, titre, description, type, fichier, currentUser.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(support);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/supports/{id}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> supprimer(@PathVariable Long id, @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            boolean estAdmin = currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE
                    || currentUser.getRole() == RoleEnum.SUPER_ADMIN;
            supportCoursService.supprimer(id, currentUser.getId(), estAdmin);
            return ResponseEntity.ok(Map.of("message", "Support supprimé"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
