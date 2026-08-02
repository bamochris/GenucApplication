package cd.genuc.controller;

import cd.genuc.dto.DossierInscriptionDto;
import cd.genuc.model.DossierInscription;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.InscriptionPubliqueService;
import cd.genuc.service.AnalyseDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor

public class InscriptionPubliqueController {

    private final InscriptionPubliqueService inscriptionPubliqueService;
    private final AnalyseDocumentService analyseDocumentService;

    // ══════════════════════════════════════════
    // 1. L'étudiant soumet son dossier
    // ══════════════════════════════════════════

    @PostMapping("/inscription")
    public ResponseEntity<?> soumettreDossier(@Valid @RequestBody DossierInscriptionDto dto) {
        try {
            DossierInscription dossier = inscriptionPubliqueService.soumettre(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Votre dossier a été soumis avec succès",
                "numeroDossier", dossier.getNumeroDossier(),
                "statut", dossier.getStatut(),
                "dateSoumission", dossier.getCreeLe()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // 2. Admin : lister les dossiers d'une université
    // ══════════════════════════════════════════

    @GetMapping("/admin/dossiers")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> listerDossiers(
            @RequestParam Long universiteId,
            @RequestParam(required = false) String statut) {
        return ResponseEntity.ok(inscriptionPubliqueService.listerParUniversite(universiteId, statut));
    }

    @PutMapping("/admin/dossiers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> corrigerDossier(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            DossierInscription dossier = inscriptionPubliqueService.corrigerDossierParAdministration(id, body);
            return ResponseEntity.ok(Map.of(
                "message", "Dossier corrigé avec succès",
                "dossier", dossier
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // 3. Admin : valider un dossier
    // ══════════════════════════════════════════

    @PatchMapping("/admin/dossiers/{id}/valider")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> validerDossier(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            Long adminId = body != null && body.get("adminId") != null
                ? Long.valueOf(body.get("adminId")) : null;
            String commentaire = body != null ? body.get("commentaire") : null;

            Map<String, Object> result = inscriptionPubliqueService.validerDossier(id, adminId, commentaire);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // 4. Admin/Étudiant : télécharger la lettre d'admission (HTML imprimable)
    // ══════════════════════════════════════════

    @GetMapping(value = "/admin/dossiers/{id}/lettre-acceptation", produces = MediaType.TEXT_HTML_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE', 'ETUDIANT')")
    public ResponseEntity<String> getLettre(@PathVariable Long id) {
        try {
            String html = inscriptionPubliqueService.genererLettre(id);
            return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .contentType(MediaType.TEXT_HTML)
                .body("<h3>Erreur : " + e.getMessage() + "</h3>");
        }
    }

        // Rendu par le frontend (route /verifier-admission), cf. VerifierAdmission.jsx —
        // même pattern que /api/lettres-acceptation/verifier/{uuid} + /verifier-lettre/:uuid.
        @GetMapping("/admission/verifier")
        public ResponseEntity<?> verifierAdmission(@RequestParam String numeroDossier,
                                                    @RequestParam String matricule,
                                                    @RequestParam String universiteCode) {
                try {
                        Map<String, Object> verification = inscriptionPubliqueService.verifierDocumentAdmission(numeroDossier, matricule, universiteCode);
                        return ResponseEntity.ok(verification);
                } catch (RuntimeException e) {
                        return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
                }
        }

    // ══════════════════════════════════════════
    // 5. Admin : rejeter un dossier
    // ══════════════════════════════════════════

    @PatchMapping("/admin/dossiers/{id}/rejeter")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> rejeterDossier(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String motif = body != null ? body.getOrDefault("motif", "Non spécifié") : "Non spécifié";
            DossierInscription dossier = inscriptionPubliqueService.rejeterDossier(id, motif);
            return ResponseEntity.ok(Map.of(
                "message", "Dossier rejeté",
                "statut", dossier.getStatut(),
                "motif", dossier.getMotifRejet()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // 6. Admin/Secrétaire : demander des documents complémentaires
    // ══════════════════════════════════════════

    @PatchMapping("/admin/dossiers/{id}/demander-documents")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> demanderDocuments(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<String> documents = body.get("documents") instanceof List
                ? (List<String>) body.get("documents") : List.of();
            String message = body.get("message") != null ? body.get("message").toString() : null;
            DossierInscription dossier = inscriptionPubliqueService.demanderDocuments(id, documents, message);
            return ResponseEntity.ok(Map.of(
                "message", "Demande de documents envoyée à l'étudiant",
                "statut", dossier.getStatut(),
                "documentsDemandes", dossier.getDocumentsDemandes() != null ? dossier.getDocumentsDemandes() : ""
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // 7. Admin/Secrétaire : analyse machine LOCALE des pièces (déterministe + OCR local)
    // ══════════════════════════════════════════

    @GetMapping("/admin/dossiers/{id}/analyse")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> analyserPieces(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(analyseDocumentService.analyser(inscriptionPubliqueService.obtenir(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // 8. Marquer les frais d'inscription comme payés (secrétariat / caisse)
    // ══════════════════════════════════════════

    @PatchMapping("/admin/dossiers/{id}/marquer-paye")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE', 'CAISSIER', 'AGENT')")
    public ResponseEntity<?> marquerPaye(@PathVariable Long id,
                                         @RequestBody(required = false) Map<String, String> body) {
        try {
            String reference = body != null ? body.get("reference") : null;
            DossierInscription dossier = inscriptionPubliqueService.marquerFraisPayes(id, reference);
            return ResponseEntity.ok(Map.of(
                "message", "Frais d'inscription marqués comme payés",
                "fraisInscriptionPayes", dossier.getFraisInscriptionPayes(),
                "reference", dossier.getReferencePaiement()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // 9. Test d'admission (< 60%) + communication secrétariat
    // ══════════════════════════════════════════

    @PatchMapping("/admin/dossiers/{id}/convoquer-test")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> convoquerTest(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> body) {
        try {
            String msg = body != null ? body.get("message") : null;
            DossierInscription d = inscriptionPubliqueService.convoquerTestAdmission(id, msg);
            return ResponseEntity.ok(Map.of(
                "message", "Candidat convoqué au test d'admission (email envoyé).",
                "statut", d.getStatut()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/admin/dossiers/{id}/test-reussi")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> testReussi(@PathVariable Long id) {
        try {
            DossierInscription d = inscriptionPubliqueService.marquerTestReussi(id);
            return ResponseEntity.ok(Map.of(
                "message", "Test d'admission marqué réussi. Le dossier peut maintenant être validé.",
                "statut", d.getStatut()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/admin/dossiers/{id}/verifier-exetat")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> verifierExetat(@PathVariable Long id,
                                            @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            String agent = currentUser != null ? currentUser.getNomComplet() : null;
            DossierInscription d = inscriptionPubliqueService.verifierExetat(id, agent);
            return ResponseEntity.ok(Map.of(
                "message", "Code EXETAT vérifié. Le dossier peut être validé.",
                "exetatVerifie", Boolean.TRUE.equals(d.getExetatVerifie())));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/admin/dossiers/{id}/message")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> envoyerMessageCandidat(@PathVariable Long id,
                                                    @RequestBody Map<String, String> body) {
        try {
            String message = body != null ? body.get("message") : null;
            if (message == null || message.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Le message est vide."));
            }
            String sujet = body.getOrDefault("sujet", "Information — inscription");
            inscriptionPubliqueService.envoyerMessageAuCandidat(id, sujet, message);
            return ResponseEntity.ok(Map.of("message", "Message envoyé au candidat par email."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/admin/dossiers/{id}/renvoyer-activation")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> renvoyerActivation(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(inscriptionPubliqueService.renvoyerActivation(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}