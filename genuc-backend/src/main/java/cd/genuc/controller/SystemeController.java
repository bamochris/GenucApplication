package cd.genuc.controller;

import cd.genuc.service.SystemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/systeme")
@RequiredArgsConstructor
public class SystemeController {

    private final SystemeService systemeService;

    @GetMapping("/backup")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_SYSTEME')")
    public ResponseEntity<ByteArrayResource> telechargerBackup() {
        try {
            byte[] data = systemeService.effectuerBackup();
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = "backup_genuc_" + timestamp + ".sql";

            ByteArrayResource resource = new ByteArrayResource(data);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(data.length)
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/restore")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_SYSTEME')")
    public ResponseEntity<?> restaurerBase(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Fichier vide"));
            }

            String filename = file.getOriginalFilename();
            if (filename == null || !filename.endsWith(".sql")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Seuls les fichiers .sql sont acceptés"));
            }

            // Utilisation d'un InputStream pour éviter de charger tout le fichier en mémoire
            try (InputStream inputStream = file.getInputStream()) {
                systemeService.effectuerRestauration(inputStream, filename);
            }

            return ResponseEntity.ok(Map.of("message", "Restauration effectuée avec succès"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}