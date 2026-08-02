package cd.genuc.controller;

import cd.genuc.service.ImportExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/notes/import-export")
@RequiredArgsConstructor
public class ImportExportController {

    private final ImportExportService importExportService;

    // ═══════════════════════════════════════════════════════════════
    // 1. IMPORT
    // ═══════════════════════════════════════════════════════════════

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> importerNotes(
            @RequestParam("file") MultipartFile file,
            @RequestParam("coursId") Long coursId,
            @RequestParam("anneeAcademique") String anneeAcademique,
            @RequestParam(value = "professeurId", required = false) Long professeurId) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Fichier vide"));
            }
            Map<String, Object> resultat = importExportService.importerNotes(file, coursId, anneeAcademique, professeurId);
            return ResponseEntity.ok(resultat);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. EXPORT
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/export/{coursId}/{annee}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<ByteArrayResource> exporterNotes(
            @PathVariable Long coursId,
            @PathVariable String annee) {
        try {
            byte[] data = importExportService.exporterNotesCours(coursId, annee);
            ByteArrayResource resource = new ByteArrayResource(data);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=notes_cours_" + coursId + "_" + annee + ".xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(data.length)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. MODÈLE D'IMPORT
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/modele")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<ByteArrayResource> telechargerModele() {
        try {
            byte[] data = importExportService.exporterModeleImport();
            ByteArrayResource resource = new ByteArrayResource(data);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=modele_import_notes.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(data.length)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}