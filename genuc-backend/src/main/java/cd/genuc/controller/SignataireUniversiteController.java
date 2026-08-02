package cd.genuc.controller;

import cd.genuc.model.RoleEnum;
import cd.genuc.model.TypeDocumentSignable;
import cd.genuc.service.SignatureElectroniqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 🖋️ Signataires électroniques d'une université — chaque université peut enregistrer
 * plusieurs responsables habilités à signer (recteur, doyen, secrétaire académique...) et
 * configurer, par type de document, quel signataire s'applique par défaut. Ces signataires
 * sont utilisés par {@code AttestationService} (attestations + diplômes) et
 * {@code LettreAcceptationService} (lettres d'acceptation) pour signer électroniquement
 * les documents officiels générés.
 */
@RestController
@RequiredArgsConstructor
public class SignataireUniversiteController {

    private final SignatureElectroniqueService signatureService;

    // ═══════════════════════════════════════════════
    // SIGNATAIRES
    // ═══════════════════════════════════════════════

    @GetMapping("/api/universites/{universiteId}/signataires")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> lister(@PathVariable Long universiteId,
                                     @RequestParam(defaultValue = "false") boolean actifsSeuls) {
        return ResponseEntity.ok(signatureService.listerSignataires(universiteId, actifsSeuls));
    }

    @PostMapping("/api/universites/{universiteId}/signataires")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creer(@PathVariable Long universiteId, @RequestBody Map<String, Object> body) {
        try {
            RoleEnum roleRattache = body.get("roleRattache") != null
                    ? RoleEnum.valueOf(body.get("roleRattache").toString()) : null;
            Long utilisateurId = body.get("utilisateurId") != null
                    ? Long.valueOf(body.get("utilisateurId").toString()) : null;

            var resultat = signatureService.creerSignataire(
                    universiteId,
                    (String) body.get("nomComplet"),
                    (String) body.get("fonction"),
                    roleRattache,
                    utilisateurId,
                    (String) body.get("signatureImage")
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(resultat);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/api/signataires/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> modifier(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            RoleEnum roleRattache = body.get("roleRattache") != null
                    ? RoleEnum.valueOf(body.get("roleRattache").toString()) : null;
            Long utilisateurId = body.get("utilisateurId") != null
                    ? Long.valueOf(body.get("utilisateurId").toString()) : null;
            Boolean actif = body.get("actif") != null ? (Boolean) body.get("actif") : null;

            var resultat = signatureService.modifierSignataire(
                    id,
                    (String) body.get("nomComplet"),
                    (String) body.get("fonction"),
                    roleRattache,
                    utilisateurId,
                    (String) body.get("signatureImage"),
                    actif
            );
            return ResponseEntity.ok(resultat);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/api/signataires/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> supprimer(@PathVariable Long id) {
        try {
            signatureService.supprimerSignataire(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════
    // RÈGLES PAR TYPE DE DOCUMENT
    // ═══════════════════════════════════════════════

    @GetMapping("/api/universites/{universiteId}/regles-signature")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> listerRegles(@PathVariable Long universiteId) {
        return ResponseEntity.ok(signatureService.listerRegles(universiteId));
    }

    @PutMapping("/api/universites/{universiteId}/regles-signature")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> definirRegle(@PathVariable Long universiteId, @RequestBody Map<String, Object> body) {
        try {
            TypeDocumentSignable type = TypeDocumentSignable.valueOf((String) body.get("typeDocument"));
            Long signataireId = Long.valueOf(body.get("signataireId").toString());
            var resultat = signatureService.definirRegle(universiteId, type, signataireId);
            return ResponseEntity.ok(resultat);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════
    // VÉRIFICATION PUBLIQUE
    // ═══════════════════════════════════════════════

    @GetMapping("/api/signatures/verifier/{code}")
    public ResponseEntity<?> verifier(@PathVariable String code) {
        try {
            return ResponseEntity.ok(signatureService.verifier(code));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(Map.of("valide", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/signatures/{code}/revoquer")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> revoquer(@PathVariable String code, @RequestBody Map<String, String> body) {
        try {
            signatureService.revoquer(code, body.get("motif"));
            return ResponseEntity.ok(Map.of("message", "Signature révoquée"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
