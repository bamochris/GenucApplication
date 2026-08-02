package cd.genuc.controller;

import cd.genuc.service.CarteEtudiantService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/carte-etudiant")
@RequiredArgsConstructor
public class CarteEtudiantController {

    private final CarteEtudiantService carteService;

    /**
     * Télécharger une carte individuelle (étudiant ou admin)
     */
    @GetMapping("/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<ByteArrayResource> getCarte(@PathVariable Long inscriptionId) {
        try {
            byte[] data = carteService.genererCarteEtudiant(inscriptionId);
            ByteArrayResource resource = new ByteArrayResource(data);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=carte_etudiant_" + inscriptionId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(data.length)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Générer les cartes de toute une promotion (admin seulement)
     */
    @PostMapping("/promotion/{promotionId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> genererCartesPromotion(@PathVariable Long promotionId) {
        try {
            Map<String, Object> result = carteService.genererCartesPromotion(promotionId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    /**
     * Version avec sauvegarde sur le serveur (optionnel)
     */
    @GetMapping("/{inscriptionId}/sauvegardee")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<ByteArrayResource> getCarteSauvegardee(@PathVariable Long inscriptionId) {
        try {
            byte[] data = carteService.getCarteSauvegardee(inscriptionId);
            ByteArrayResource resource = new ByteArrayResource(data);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=carte_etudiant_" + inscriptionId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(data.length)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}