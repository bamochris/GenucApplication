package cd.genuc.controller;

import cd.genuc.model.DocumentOfficielConfig;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.DocumentsOfficielsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/documents-officiels/admin/configurations")
@RequiredArgsConstructor
public class DocumentOfficielConfigController {

    private final DocumentsOfficielsService documentsOfficielsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE', 'SUPER_ADMIN')")
    public ResponseEntity<?> list(@AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.ok(documentsOfficielsService.getConfigurationsAdmin(user.getUniversiteId()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE', 'SUPER_ADMIN')")
    public ResponseEntity<?> create(@AuthenticationPrincipal Utilisateur user,
                                    @RequestBody Map<String, Object> body) {
        try {
            DocumentOfficielConfig config = documentsOfficielsService.saveConfiguration(user.getUniversiteId(), null, body);
            return ResponseEntity.ok(config);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE', 'SUPER_ADMIN')")
    public ResponseEntity<?> update(@AuthenticationPrincipal Utilisateur user,
                                    @PathVariable Long id,
                                    @RequestBody Map<String, Object> body) {
        try {
            DocumentOfficielConfig config = documentsOfficielsService.saveConfiguration(user.getUniversiteId(), id, body);
            return ResponseEntity.ok(config);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE', 'SUPER_ADMIN')")
    public ResponseEntity<?> toggle(@AuthenticationPrincipal Utilisateur user,
                                    @PathVariable Long id,
                                    @RequestBody Map<String, Object> body) {
        try {
            boolean actif = body.get("actif") == null || Boolean.parseBoolean(body.get("actif").toString());
            DocumentOfficielConfig config = documentsOfficielsService.changerStatut(user.getUniversiteId(), id, actif);
            return ResponseEntity.ok(config);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}