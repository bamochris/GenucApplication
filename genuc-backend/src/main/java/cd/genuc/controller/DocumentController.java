package cd.genuc.controller;

import cd.genuc.service.DocumentService;
import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> upload(@RequestParam Long etudiantId,
                                    @RequestParam String type,
                                    @RequestParam MultipartFile file) {
        try {
            return ResponseEntity.ok(documentService.uploadDocument(etudiantId, type, file));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/etudiant/{id}/archiver")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> archiver(@PathVariable Long id) {
        documentService.archiverEtudiant(id);
        return ResponseEntity.ok(Map.of("message", "Étudiant archivé"));
    }
}