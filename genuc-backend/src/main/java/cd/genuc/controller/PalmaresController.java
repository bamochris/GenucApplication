package cd.genuc.controller;

import cd.genuc.model.MeilleurEtudiant;
import cd.genuc.model.ParametrePalmares;
import cd.genuc.service.PalmaresService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/palmares")
@RequiredArgsConstructor
public class PalmaresController {

    private final PalmaresService palmaresService;

    @Value("${genuc.upload.dir:/tmp/genuc}")
    private String uploadDir;

    // ════════════════════════════════════════════
    // PUBLIC
    // ════════════════════════════════════════════

    @GetMapping("/public")
    public ResponseEntity<List<MeilleurEtudiant>> getPublic() {
        return ResponseEntity.ok(palmaresService.getPalmaresPublic());
    }

    @GetMapping("/public/filtres")
    public ResponseEntity<List<MeilleurEtudiant>> getFiltres(
            @RequestParam String annee,
            @RequestParam(required = false) String universite,
            @RequestParam(required = false) String filiere) {
        return ResponseEntity.ok(palmaresService.getPalmaresParFiltres(annee, universite, filiere));
    }

    @GetMapping("/public/annees")
    public ResponseEntity<List<String>> getAnnees() {
        return ResponseEntity.ok(palmaresService.getAnneesDisponibles());
    }

    // ════════════════════════════════════════════
    // ADMIN : PARAMÈTRES
    // ════════════════════════════════════════════

    @GetMapping("/params/{universiteId}/{annee}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<ParametrePalmares> getParametres(
            @PathVariable Long universiteId,
            @PathVariable String annee) {
        return ResponseEntity.ok(palmaresService.getParametres(universiteId, annee));
    }

    @PostMapping("/params")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> creerParametres(@RequestBody ParametrePalmares parametres) {
        try {
            return ResponseEntity.ok(palmaresService.creerOuModifierParametres(parametres));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // ADMIN : GÉNÉRATION
    // ════════════════════════════════════════════

    @PostMapping("/generer")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> generer(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("universiteId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "universiteId est requis"));
            }
            if (!body.containsKey("anneeAcademique")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "anneeAcademique est requis"));
            }

            Long universiteId = Long.valueOf(body.get("universiteId").toString());
            String annee = (String) body.get("anneeAcademique");

            ParametrePalmares params = palmaresService.getParametres(universiteId, annee);
            Map<String, Object> result = palmaresService.genererPalmares(params);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/generer-auto")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> genererAuto() {
        palmaresService.genererPalmaresAutomatique();
        return ResponseEntity.ok(Map.of("message", "Génération automatique déclenchée"));
    }

    // ════════════════════════════════════════════
    // ADMIN : VALIDATION
    // ════════════════════════════════════════════

    @GetMapping("/en-attente")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> getEnAttente() {
        return ResponseEntity.ok(palmaresService.getEnAttente());
    }

    @PatchMapping("/{id}/valider")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> valider(@PathVariable Long id,
                                     @RequestBody(required = false) Map<String, Object> body) {
        try {
            Long adminId = body != null && body.containsKey("adminId")
                    ? Long.valueOf(body.get("adminId").toString())
                    : null;
            MeilleurEtudiant me = palmaresService.validerLauréat(id, adminId);
            return ResponseEntity.ok(Map.of(
                    "message", "Lauréat validé",
                    "id", me.getId(),
                    "nom", me.getNomComplet(),
                    "statut", me.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/rejeter")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> rejeter(@PathVariable Long id,
                                     @RequestBody Map<String, Object> body) {
        try {
            String motif = body != null && body.containsKey("motif")
                    ? (String) body.get("motif")
                    : "Non spécifié";
            MeilleurEtudiant me = palmaresService.rejeterLauréat(id, motif);
            return ResponseEntity.ok(Map.of(
                    "message", "Lauréat rejeté",
                    "id", me.getId(),
                    "statut", me.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/valider-lot")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> validerLot(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("ids")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "ids est requis"));
            }
            List<Long> ids = (List<Long>) body.get("ids");
            Long adminId = body.containsKey("adminId")
                    ? Long.valueOf(body.get("adminId").toString())
                    : null;
            palmaresService.validerLot(ids, adminId);
            return ResponseEntity.ok(Map.of("message", ids.size() + " lauréats validés"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // CERTIFICAT
    // ════════════════════════════════════════════

    @GetMapping("/{id}/certificat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ByteArrayResource> getCertificat(@PathVariable Long id) {
        try {
            MeilleurEtudiant me = palmaresService.obtenir(id);
            if (me.getCertificatUrl() == null) {
                palmaresService.genererCertificat(id);
                me = palmaresService.obtenir(id);
            }

            // Utiliser un chemin absolu configurable
            Path filePath = Paths.get(uploadDir, me.getCertificatUrl());
            byte[] data = Files.readAllBytes(filePath);
            ByteArrayResource resource = new ByteArrayResource(data);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=certificat_" + id + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(data.length)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ════════════════════════════════════════════
    // EXPORT
    // ════════════════════════════════════════════

    @GetMapping("/export/excel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<ByteArrayResource> exportExcel(
            @RequestParam String annee,
            @RequestParam(required = false) Long universiteId) {
        try {
            byte[] data = palmaresService.exporterPalmaresExcel(annee, universiteId);
            ByteArrayResource resource = new ByteArrayResource(data);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=palmares_" + annee + ".xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(data.length)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ════════════════════════════════════════════
    // STATISTIQUES (Recteur)
    // ════════════════════════════════════════════

    @GetMapping("/stats/{universiteId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'RECTEUR')")
    public ResponseEntity<?> getStats(@PathVariable Long universiteId) {
        return ResponseEntity.ok(palmaresService.getStatistiquesPalmares(universiteId));
    }

    // ════════════════════════════════════════════
    // NOTIFICATIONS
    // ════════════════════════════════════════════

    @PostMapping("/notifier-tous")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> notifierTous() {
        palmaresService.notifierTousLesLauréats();
        return ResponseEntity.ok(Map.of("message", "Notifications envoyées à tous les lauréats"));
    }
}