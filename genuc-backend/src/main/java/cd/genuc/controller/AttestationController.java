package cd.genuc.controller;

import cd.genuc.model.Attestation;
import cd.genuc.service.AttestationService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attestations")
@RequiredArgsConstructor
public class AttestationController {

    private final AttestationService attestationService;

    // ════════════════════════════════════════════
    // ÉTUDIANT : Demander une attestation
    // ════════════════════════════════════════════

    @PostMapping("/demander")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> demanderAttestation(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("inscriptionId") || !body.containsKey("type") || !body.containsKey("demandeurId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "inscriptionId, type et demandeurId sont requis"));
            }
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            Attestation.TypeAttestation type = Attestation.TypeAttestation.valueOf((String) body.get("type"));
            String motif = (String) body.get("motif");
            Long demandeurId = Long.valueOf(body.get("demandeurId").toString());
            String demandeurNom = (String) body.get("demandeurNom");
                String codeDocument = (String) body.get("codeDocument");
                String libelleDocument = (String) body.get("libelleDocument");

            Attestation attestation = attestationService.demanderAttestation(
                    inscriptionId, type, motif, demandeurId, demandeurNom, codeDocument, libelleDocument
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Demande d'attestation soumise avec succès",
                    "id", attestation.getId(),
                    "numero", attestation.getNumeroAttestation(),
                    "statut", attestation.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // ADMIN : Créer directement (avec validation auto)
    // ════════════════════════════════════════════

    @PostMapping("/admin/creer")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> creerAttestationAdmin(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("inscriptionId") || !body.containsKey("type") || !body.containsKey("demandeurId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "inscriptionId, type et demandeurId sont requis"));
            }
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            Attestation.TypeAttestation type = Attestation.TypeAttestation.valueOf((String) body.get("type"));
            String motif = (String) body.get("motif");
            Long demandeurId = Long.valueOf(body.get("demandeurId").toString());
            String demandeurNom = (String) body.get("demandeurNom");
            String contenuPersonnalise = (String) body.get("contenuPersonnalise");
                String codeDocument = (String) body.get("codeDocument");
                String libelleDocument = (String) body.get("libelleDocument");

            // 1. Créer la demande
            Attestation attestation = attestationService.demanderAttestation(
                    inscriptionId, type, motif, demandeurId, demandeurNom, codeDocument, libelleDocument
            );

            // 2. Valider automatiquement
            attestation = attestationService.validerAttestation(
                    attestation.getId(), demandeurId, demandeurNom
            );

            // 3. Si contenu personnalisé fourni, le définir
            if (contenuPersonnalise != null && !contenuPersonnalise.isEmpty()) {
                attestation.setContenu(contenuPersonnalise);
                attestation = attestationService.save(attestation);
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Attestation créée et validée avec succès",
                    "id", attestation.getId(),
                    "numero", attestation.getNumeroAttestation(),
                    "statut", attestation.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // ADMIN : Valider / Rejeter
    // ════════════════════════════════════════════

    @PatchMapping("/{id}/valider")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> validerAttestation(@PathVariable Long id,
                                                @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("valideurId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "valideurId est requis"));
            }
            Long valideurId = Long.valueOf(body.get("valideurId").toString());
            String valideurNom = (String) body.get("valideurNom");
            Long signataireId = body.get("signataireId") != null
                    ? Long.valueOf(body.get("signataireId").toString()) : null;

            Attestation attestation = attestationService.validerAttestation(id, valideurId, valideurNom, signataireId);

            return ResponseEntity.ok(Map.of(
                    "message", "Attestation validée avec succès",
                    "id", attestation.getId(),
                    "numero", attestation.getNumeroAttestation(),
                    "statut", attestation.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/rejeter")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> rejeterAttestation(@PathVariable Long id,
                                                @RequestBody Map<String, Object> body) {
        try {
            String motif = (String) body.get("motif");
            Attestation attestation = attestationService.rejeterAttestation(id, motif);

            return ResponseEntity.ok(Map.of(
                    "message", "Attestation rejetée",
                    "id", attestation.getId(),
                    "statut", attestation.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // GÉNÉRATION PDF
    // ════════════════════════════════════════════

    @GetMapping("/{id}/pdf")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ByteArrayResource> genererPdf(@PathVariable Long id) {
        try {
            byte[] pdfBytes = attestationService.genererAttestationPdf(id);
            ByteArrayResource resource = new ByteArrayResource(pdfBytes);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attestation_" + id + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfBytes.length)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ════════════════════════════════════════════
    // ENVOI PAR EMAIL (CORRIGÉ)
    // ════════════════════════════════════════════

    @PostMapping("/{id}/envoyer-email")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> envoyerParEmail(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "L'adresse email est obligatoire"));
            }

            attestationService.envoyerAttestationParEmail(id, email);

            return ResponseEntity.ok(Map.of("message", "Attestation envoyée par email avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // CONSULTATION
    // ════════════════════════════════════════════

    @GetMapping("/etudiant/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<List<Attestation>> getMesAttestations(@PathVariable Long inscriptionId) {
        return ResponseEntity.ok(attestationService.getAttestationsByInscription(inscriptionId));
    }

    @GetMapping("/en-attente/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<List<Attestation>> getEnAttente(@PathVariable Long universiteId) {
        return ResponseEntity.ok(attestationService.getAttestationsEnAttente(universiteId));
    }

    // ════════════════════════════════════════════
    // VÉRIFICATION PUBLIQUE
    // ════════════════════════════════════════════

    @GetMapping("/verifier/{uuid}")
    public ResponseEntity<?> verifierAttestation(@PathVariable String uuid) {
        try {
            return ResponseEntity.ok(attestationService.verifierAttestation(uuid));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(Map.of(
                    "valide", false,
                    "message", e.getMessage()
            ));
        }
    }
}