// src/main/java/cd/genuc/controller/FraisEtudiantController.java
package cd.genuc.controller;

import cd.genuc.model.Utilisateur;
import cd.genuc.service.FraisEtudiantService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/etudiant/frais")
@RequiredArgsConstructor
public class FraisEtudiantController {

    private final FraisEtudiantService fraisEtudiantService;

    @GetMapping("/situation")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> getSituation(@AuthenticationPrincipal Utilisateur user) {
        Long inscriptionId = user.getInscriptionId();
        if (inscriptionId == null) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune inscription associée"));
        }
        return ResponseEntity.ok(fraisEtudiantService.getSituationFinanciere(inscriptionId));
    }

    @GetMapping("/a-payer")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> getFraisAPayer(@AuthenticationPrincipal Utilisateur user) {
        Long inscriptionId = user.getInscriptionId();
        if (inscriptionId == null) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune inscription associée"));
        }
        return ResponseEntity.ok(fraisEtudiantService.getFraisAPayer(inscriptionId));
    }

    @GetMapping("/historique")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> getHistoriquePaiements(@AuthenticationPrincipal Utilisateur user) {
        Long inscriptionId = user.getInscriptionId();
        if (inscriptionId == null) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune inscription associée"));
        }
        return ResponseEntity.ok(fraisEtudiantService.getHistoriquePaiements(inscriptionId));
    }

    @GetMapping("/recu/{paiementId}")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<ByteArrayResource> telechargerRecu(@PathVariable Long paiementId) {
        try {
            byte[] pdf = fraisEtudiantService.genererRecu(paiementId);
            ByteArrayResource resource = new ByteArrayResource(pdf);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=recu_" + paiementId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdf.length)
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}