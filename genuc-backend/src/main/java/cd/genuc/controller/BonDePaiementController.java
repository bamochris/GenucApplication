package cd.genuc.controller;

import cd.genuc.dto.BonDePaiementDTO;
import cd.genuc.service.BonDePaiementService;
import cd.genuc.service.TachPayCaisseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 🧾 API REST — Bons de Paiement avec QR Code
 * ✅ Génération de QR Code (infos bancaires + Mobile Money)
 * ✅ Gestion complète CRUD
 * ✅ Vérification, annulation
 */
@RestController
@RequestMapping("/api/bons-paiement")
@RequiredArgsConstructor
@Tag(name = "Bons de paiement", description = "🧾 Gestion des bons de paiement avec QR Code (bancaire + Mobile Money)")
public class BonDePaiementController {

    private final BonDePaiementService bonService;
    private final TachPayCaisseService caisseService;

    // ════════════════════════════════════════════════════════════════
    //  CRUD
    // ════════════════════════════════════════════════════════════════

    @PostMapping
    @Operation(summary = "Générer un bon de paiement", description = "Crée un nouveau bon avec QR Code contenant les coordonnées bancaires et Mobile Money")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> generer(@RequestBody Map<String, Object> body) {
        try {
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            Double montant = Double.valueOf(body.get("montant").toString());
            String observations = (String) body.getOrDefault("observations", "");

            BonDePaiementDTO bon = bonService.genererBon(inscriptionId, montant, observations);
            return ResponseEntity.status(HttpStatus.CREATED).body(bon);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "Lister tous les bons de paiement")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> listerTous() {
        try {
            return ResponseEntity.ok(bonService.getAllBons());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un bon de paiement par son ID")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getBon(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bonService.getBon(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/numero/{numero}")
    @Operation(summary = "Obtenir un bon de paiement par son numéro")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getBonByNumero(@PathVariable String numero) {
        try {
            return ResponseEntity.ok(bonService.getBonByNumero(numero));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/inscription/{inscriptionId}")
    @Operation(summary = "Lister les bons d'une inscription")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'AGENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> getBonsByInscription(@PathVariable Long inscriptionId) {
        try {
            return ResponseEntity.ok(bonService.getBonsByInscription(inscriptionId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/inscription/{inscriptionId}/actifs")
    @Operation(summary = "Lister les bons actifs (non utilisés) d'une inscription")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'AGENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> getBonsActifsByInscription(@PathVariable Long inscriptionId) {
        try {
            return ResponseEntity.ok(bonService.getBonsActifsByInscription(inscriptionId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Télécharger le bon de paiement en PDF (avec QR code)")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> telechargerPdf(@PathVariable Long id) {
        try {
            byte[] pdf = bonService.genererBonPdf(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bon_paiement_" + id + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF du bon de paiement", e);
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  ACTIONS
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/{numero}/verifier")
    @Operation(summary = "Vérifier la validité d'un bon de paiement")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> verifierBon(@PathVariable String numero) {
        try {
            Map<String, Object> result = caisseService.verifierBon(numero);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{id}/annuler")
    @Operation(summary = "Annuler un bon de paiement")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> annulerBon(@PathVariable Long id,
                                        @RequestBody(required = false) Map<String, String> body) {
        try {
            String motif = body != null ? body.get("motif") : "Annulation administrative";
            BonDePaiementDTO bon = bonService.annulerBon(id, motif);
            return ResponseEntity.ok(bon);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
