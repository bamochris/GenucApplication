package cd.genuc.controller;

import cd.genuc.model.*;
import cd.genuc.repository.DemandeSignatureRepository;
import cd.genuc.repository.SignataireUniversiteRepository;
import cd.genuc.repository.UtilisateurRepository;
import cd.genuc.service.NotificationService;
import cd.genuc.service.SignatureElectroniqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Flux de signature électronique des responsables :
 *  1. Le responsable (lié à un SignataireUniversite) dépose SA signature
 *     depuis son interface (bandeau d'invitation tant qu'elle manque).
 *  2. Les demandes de signature (document unique ou lot) lui sont notifiées ;
 *     à validation, sa signature est apposée sur chaque document du lot.
 */
@RestController
@RequiredArgsConstructor
public class DemandeSignatureController {

    private final SignataireUniversiteRepository signataireRepo;
    private final DemandeSignatureRepository demandeRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final SignatureElectroniqueService signatureService;
    private final NotificationService notificationService;

    // ════════════════════════════════════════════════════════════════
    //  MA SIGNATURE (le responsable connecté)
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/api/signature/ma-signature")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> maSignature(@AuthenticationPrincipal Utilisateur currentUser) {
        Map<String, Object> reponse = new HashMap<>();
        var signataireOpt = signataireRepo.findFirstByUtilisateurIdAndActifTrue(currentUser.getId());
        if (signataireOpt.isEmpty()) {
            reponse.put("estSignataire", false);
            reponse.put("aSignature", false);
            reponse.put("demandesEnAttente", 0);
            return ResponseEntity.ok(reponse);
        }
        SignataireUniversite signataire = signataireOpt.get();
        reponse.put("estSignataire", true);
        reponse.put("signataireId", signataire.getId());
        reponse.put("fonction", signataire.getFonction());
        reponse.put("aSignature", signataire.getSignatureImage() != null && !signataire.getSignatureImage().isBlank());
        reponse.put("demandesEnAttente",
                demandeRepo.countBySignataireIdAndStatut(signataire.getId(), DemandeSignature.Statut.EN_ATTENTE));
        return ResponseEntity.ok(reponse);
    }

    /** Le responsable dépose (ou remplace) sa propre signature électronique. */
    @PostMapping("/api/signature/ma-signature")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<?> deposerMaSignature(@RequestBody Map<String, Object> body,
                                                @AuthenticationPrincipal Utilisateur currentUser) {
        String image = body.get("signatureImage") != null ? body.get("signatureImage").toString() : null;
        if (image == null || image.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "L'image de la signature est obligatoire."));
        }
        SignataireUniversite signataire = signataireRepo.findFirstByUtilisateurIdAndActifTrue(currentUser.getId())
                .orElse(null);
        if (signataire == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Aucun profil de signataire n'est rattaché à votre compte."));
        }
        signataire.setSignatureImage(image);
        signataireRepo.save(signataire);

        // La signature est enregistrée chez le responsable ET visible des autres
        // responsables via le registre des signataires ; on prévient l'université.
        notificationService.envoyerNotificationUniversite(
                signataire.getUniversite().getId(),
                "Signature électronique enregistrée",
                signataire.getNomComplet() + " (" + signataire.getFonction()
                        + ") a enregistré sa signature électronique.",
                Notification.TypeNotification.SUCCES,
                "/admin/signataires");

        return ResponseEntity.ok(Map.of("message", "Votre signature électronique a été enregistrée."));
    }

    // ════════════════════════════════════════════════════════════════
    //  DEMANDES DE SIGNATURE (document unique ou lot)
    // ════════════════════════════════════════════════════════════════

    /** Crée une demande de signature adressée à un responsable. */
    @PostMapping("/api/signature/demandes")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE', 'DOYEN', 'RECTEUR')")
    @Transactional
    public ResponseEntity<?> creerDemande(@RequestBody Map<String, Object> body,
                                          @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            Long signataireId = Long.valueOf(body.get("signataireId").toString());
            TypeDocumentSignable type = TypeDocumentSignable.valueOf(body.get("typeDocument").toString());
            @SuppressWarnings("unchecked")
            List<Object> ids = (List<Object>) body.get("documentIds");
            if (ids == null || ids.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Au moins un document est requis."));
            }
            String documentIds = ids.stream().map(Object::toString).map(String::trim)
                    .collect(Collectors.joining(","));

            SignataireUniversite signataire = signataireRepo.findById(signataireId)
                    .orElseThrow(() -> new RuntimeException("Signataire introuvable : id=" + signataireId));

            DemandeSignature demande = demandeRepo.save(DemandeSignature.builder()
                    .universite(signataire.getUniversite())
                    .signataire(signataire)
                    .typeDocument(type)
                    .documentIds(documentIds)
                    .commentaire(body.get("commentaire") != null ? body.get("commentaire").toString() : null)
                    .demandeParId(currentUser.getId())
                    .demandeParNom(currentUser.getNom() + " " + (currentUser.getPrenom() != null ? currentUser.getPrenom() : ""))
                    .build());

            // Message au responsable : « validez ce document / ce lot »
            if (signataire.getUtilisateurId() != null) {
                utilisateurRepo.findById(signataire.getUtilisateurId()).ifPresent(dest ->
                        notificationService.envoyerNotification(
                                dest,
                                "Demande de signature",
                                "Un lot de " + demande.getDocumentIdsListe().size() + " document(s) ("
                                        + type + ") attend votre validation pour signature.",
                                Notification.TypeNotification.ATTENTION,
                                "/signature/demandes"));
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Demande de signature envoyée.", "id", demande.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    /** Demandes en attente du responsable connecté. */
    @GetMapping("/api/signature/demandes/mes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> mesDemandes(@AuthenticationPrincipal Utilisateur currentUser) {
        var signataireOpt = signataireRepo.findFirstByUtilisateurIdAndActifTrue(currentUser.getId());
        if (signataireOpt.isEmpty()) return ResponseEntity.ok(List.of());
        List<Map<String, Object>> demandes = demandeRepo
                .findBySignataireIdOrderByCreeLeDesc(signataireOpt.get().getId())
                .stream().map(this::versMap).collect(Collectors.toList());
        return ResponseEntity.ok(demandes);
    }

    /**
     * Le responsable VALIDE la demande : sa signature est apposée sur chaque
     * document du lot, puis le demandeur est prévenu (documents signés/envoyés).
     */
    @PostMapping("/api/signature/demandes/{id}/valider")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<?> valider(@PathVariable Long id,
                                     @AuthenticationPrincipal Utilisateur currentUser) {
        DemandeSignature demande = demandeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable : id=" + id));
        ResponseEntity<?> refus = verifierProprietaire(demande, currentUser);
        if (refus != null) return refus;

        SignataireUniversite signataire = demande.getSignataire();
        if (signataire.getSignatureImage() == null || signataire.getSignatureImage().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erreur", "Ajoutez d'abord votre signature électronique avant de valider des documents."));
        }

        int signes = 0;
        for (Long documentId : demande.getDocumentIdsListe()) {
            // Ne double-signe pas un document déjà signé
            if (signatureService.obtenirPourDocument(demande.getTypeDocument(), documentId).isPresent()) continue;
            String contenuCanonique = demande.getTypeDocument() + ":" + documentId + ":" + signataire.getId();
            signatureService.signer(demande.getTypeDocument(), documentId, signataire,
                    contenuCanonique, UUID.randomUUID().toString(),
                    currentUser.getId(), signataire.getNomComplet());
            signes++;
        }

        demande.setStatut(DemandeSignature.Statut.VALIDEE);
        demande.setTraiteLe(LocalDateTime.now());
        demandeRepo.save(demande);

        final int nbSignes = signes;
        if (demande.getDemandeParId() != null) {
            utilisateurRepo.findById(demande.getDemandeParId()).ifPresent(dest ->
                    notificationService.envoyerNotification(
                            dest,
                            "Documents signés",
                            signataire.getNomComplet() + " a validé la demande : "
                                    + nbSignes + " document(s) signé(s) et envoyé(s).",
                            Notification.TypeNotification.SUCCES,
                            "/admin/signataires"));
        }

        return ResponseEntity.ok(Map.of(
                "message", signes + " document(s) signé(s) avec votre signature électronique.",
                "documentsSignes", signes));
    }

    /** Le responsable REFUSE la demande (avec motif). */
    @PostMapping("/api/signature/demandes/{id}/refuser")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<?> refuser(@PathVariable Long id,
                                     @RequestBody(required = false) Map<String, Object> body,
                                     @AuthenticationPrincipal Utilisateur currentUser) {
        DemandeSignature demande = demandeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable : id=" + id));
        ResponseEntity<?> refus = verifierProprietaire(demande, currentUser);
        if (refus != null) return refus;

        demande.setStatut(DemandeSignature.Statut.REFUSEE);
        demande.setMotifRefus(body != null && body.get("motif") != null ? body.get("motif").toString() : null);
        demande.setTraiteLe(LocalDateTime.now());
        demandeRepo.save(demande);

        if (demande.getDemandeParId() != null) {
            utilisateurRepo.findById(demande.getDemandeParId()).ifPresent(dest ->
                    notificationService.envoyerNotification(
                            dest,
                            "Demande de signature refusée",
                            demande.getSignataire().getNomComplet() + " a refusé la demande de signature."
                                    + (demande.getMotifRefus() != null ? " Motif : " + demande.getMotifRefus() : ""),
                            Notification.TypeNotification.ATTENTION,
                            "/admin/signataires"));
        }

        return ResponseEntity.ok(Map.of("message", "Demande refusée."));
    }

    // ─── Helpers ────────────────────────────────────────────────────

    /** La demande ne peut être traitée que par le signataire visé, et une seule fois. */
    private ResponseEntity<?> verifierProprietaire(DemandeSignature demande, Utilisateur currentUser) {
        if (!currentUser.getId().equals(demande.getSignataire().getUtilisateurId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Cette demande de signature ne vous est pas adressée."));
        }
        if (demande.getStatut() != DemandeSignature.Statut.EN_ATTENTE) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Cette demande a déjà été traitée."));
        }
        return null;
    }

    private Map<String, Object> versMap(DemandeSignature d) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", d.getId());
        m.put("typeDocument", d.getTypeDocument());
        m.put("documentIds", d.getDocumentIdsListe());
        m.put("nbDocuments", d.getDocumentIdsListe().size());
        m.put("commentaire", d.getCommentaire());
        m.put("statut", d.getStatut());
        m.put("demandeParNom", d.getDemandeParNom());
        m.put("motifRefus", d.getMotifRefus());
        m.put("creeLe", d.getCreeLe());
        m.put("traiteLe", d.getTraiteLe());
        return m;
    }
}
