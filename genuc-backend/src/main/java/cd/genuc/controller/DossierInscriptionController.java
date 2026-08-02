package cd.genuc.controller;

import cd.genuc.dto.InscriptionPubliqueRequest;
import cd.genuc.model.DossierInscription;
import cd.genuc.repository.UniversiteRepository;
import cd.genuc.service.InscriptionPubliqueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DossierInscriptionController {

    private final InscriptionPubliqueService inscriptionPubliqueService;
    private final UniversiteRepository universiteRepository;
    private final ObjectMapper objectMapper;

    /**
     * Soumission d'un dossier d'inscription complet (7 étapes)
     */
    @PostMapping(value = "/dossiers", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> soumettreDossierComplet(@Valid @RequestBody InscriptionPubliqueRequest request) {
        log.info("📝 Nouvelle soumission de dossier pour : {}", request.getEmail());

        try {
            DossierInscription dossier = inscriptionPubliqueService.soumettreDossierComplet(request);
            log.info("✅ Dossier soumis avec succès - Numéro : {}", dossier.getNumeroDossier());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Dossier soumis avec succès",
                "numeroDossier", dossier.getNumeroDossier(),
                "id", dossier.getId(),
                "statut", dossier.getStatut(),
                "email", dossier.getEmail(),
                "dateSoumission", dossier.getCreeLe(),
                "paymentLink", "/paiement-tachpay?dossier=" + dossier.getNumeroDossier(),
                "paymentExpiresAt", dossier.getCreeLe() != null ? dossier.getCreeLe().plusHours(72) : null
            ));
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erreur de validation : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "erreur", "Données invalides",
                "details", e.getMessage()
            ));
        } catch (RuntimeException e) {
            log.error("❌ Erreur lors de la soumission du dossier : {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "erreur", "Erreur lors de la soumission",
                "details", e.getMessage()
            ));
        }
    }

    /**
     * Soumission d'un dossier AVEC pièces jointes (multipart/form-data).
     * Partie "data" = JSON du dossier ; chaque document est une partie fichier optionnelle.
     */
    @PostMapping(value = "/dossiers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> soumettreDossierAvecDocuments(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "photoIdentite", required = false) MultipartFile photoIdentite,
            @RequestPart(value = "photoPasseport", required = false) MultipartFile photoPasseport,
            @RequestPart(value = "diplomeEtat", required = false) MultipartFile diplomeEtat,
            @RequestPart(value = "attestationReussite", required = false) MultipartFile attestationReussite,
            @RequestPart(value = "relevePoints", required = false) MultipartFile relevePoints,
            @RequestPart(value = "acteNaissance", required = false) MultipartFile acteNaissance,
            @RequestPart(value = "attestationNationalite", required = false) MultipartFile attestationNationalite,
            @RequestPart(value = "carteIdentite", required = false) MultipartFile carteIdentite,
            @RequestPart(value = "lettreRecommandation", required = false) MultipartFile lettreRecommandation,
            @RequestPart(value = "attestationPhysique", required = false) MultipartFile attestationPhysique,
            @RequestPart(value = "attestationConduite", required = false) MultipartFile attestationConduite) {
        try {
            InscriptionPubliqueRequest request = objectMapper.readValue(dataJson, InscriptionPubliqueRequest.class);

            Map<String, MultipartFile> fichiers = new LinkedHashMap<>();
            fichiers.put("urlPhoto", photoIdentite);
            fichiers.put("urlPhotoPasseport", photoPasseport);
            fichiers.put("urlDiplomeEtat", diplomeEtat);
            fichiers.put("urlAttestationReussite", attestationReussite);
            fichiers.put("urlReleveNotes", relevePoints);
            fichiers.put("urlActeNaissance", acteNaissance);
            fichiers.put("urlAttestationNationalite", attestationNationalite);
            fichiers.put("urlCarteIdentite", carteIdentite);
            fichiers.put("urlLettreRecommandation", lettreRecommandation);
            fichiers.put("urlAttestationPhysique", attestationPhysique);
            fichiers.put("urlAttestationConduite", attestationConduite);

            DossierInscription dossier = inscriptionPubliqueService.soumettreDossierCompletAvecDocuments(request, fichiers);
            log.info("✅ Dossier (avec documents) soumis - Numéro : {}", dossier.getNumeroDossier());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Dossier soumis avec succès",
                "numeroDossier", dossier.getNumeroDossier(),
                "id", dossier.getId(),
                "statut", dossier.getStatut(),
                "email", dossier.getEmail(),
                "dateSoumission", dossier.getCreeLe(),
                "paymentLink", "/paiement-tachpay?dossier=" + dossier.getNumeroDossier(),
                "paymentExpiresAt", dossier.getCreeLe() != null ? dossier.getCreeLe().plusHours(72) : null
            ));
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Données invalides : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", "Données invalides", "details", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Erreur soumission dossier avec documents : {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("erreur", "Erreur lors de la soumission", "details", e.getMessage()));
        }
    }

    /**
     * Vérification du statut d'un dossier par numéro de dossier
     */
    @GetMapping("/dossiers/statut/{numeroDossier}")
    public ResponseEntity<?> getStatutDossier(@PathVariable String numeroDossier) {
        try {
            DossierInscription dossier = inscriptionPubliqueService.getDossierByNumero(numeroDossier);
            // LinkedHashMap : plusieurs champs peuvent être null (Map.of les refuse)
            Map<String, Object> reponse = new LinkedHashMap<>();
            reponse.put("numeroDossier", dossier.getNumeroDossier());
            reponse.put("statut", dossier.getStatut());
            reponse.put("creeLe", dossier.getCreeLe());
            reponse.put("dateSoumission", dossier.getCreeLe());
            reponse.put("email", dossier.getEmail());
            reponse.put("nom", dossier.getNom());
            reponse.put("prenom", dossier.getPrenom());
            reponse.put("niveauVise", dossier.getNiveauVise());
            reponse.put("motifRejet", dossier.getMotifRejet());
            reponse.put("universite", dossier.getUniversiteId() != null
                ? universiteRepository.findById(dossier.getUniversiteId())
                    .map(u -> u.getNom()).orElse(null)
                : null);
            return ResponseEntity.ok(reponse);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("erreur", "Dossier non trouvé"));
        }
    }

    /**
     * Vérification du statut d'un dossier par email
     */
    @GetMapping("/dossiers/statut/email/{email}")
    public ResponseEntity<?> getStatutDossierByEmail(@PathVariable String email) {
        try {
            DossierInscription dossier = inscriptionPubliqueService.getDossierByEmail(email);
            return ResponseEntity.ok(Map.of(
                "numeroDossier", dossier.getNumeroDossier(),
                "statut", dossier.getStatut(),
                "dateSoumission", dossier.getCreeLe(),
                "nom", dossier.getNom() + " " + dossier.getPrenom()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("erreur", "Aucun dossier trouvé pour cet email"));
        }
    }

    /**
     * Annulation d'un dossier en attente (par l'étudiant)
     */
    @DeleteMapping("/dossiers/{id}/annuler")
    @PreAuthorize("@securityService.peutAccederDossier(#id, authentication)")
    public ResponseEntity<?> annulerDossier(@PathVariable Long id) {
        try {
            DossierInscription dossier = inscriptionPubliqueService.annulerDossier(id);
            return ResponseEntity.ok(Map.of(
                "message", "Dossier annulé avec succès",
                "numeroDossier", dossier.getNumeroDossier(),
                "statut", dossier.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    /**
     * Mise à jour d'un dossier en attente (par l'étudiant)
     */
    @PutMapping("/dossiers/{id}")
    @PreAuthorize("@securityService.peutAccederDossier(#id, authentication)")
    public ResponseEntity<?> updateDossier(@PathVariable Long id,
                                           @Valid @RequestBody InscriptionPubliqueRequest request) {
        try {
            DossierInscription dossier = inscriptionPubliqueService.updateDossier(id, request);
            return ResponseEntity.ok(Map.of(
                "message", "Dossier mis à jour avec succès",
                "numeroDossier", dossier.getNumeroDossier(),
                "statut", dossier.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    /**
     * Infos de paiement d'un dossier (page publique de paiement par n° de dossier).
     */
    @GetMapping("/dossiers/{numeroDossier}/paiement")
    public ResponseEntity<?> infosPaiement(@PathVariable String numeroDossier) {
        try {
            return ResponseEntity.ok(inscriptionPubliqueService.getPaiementInfo(numeroDossier));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", "Dossier non trouvé"));
        }
    }

    /**
     * Paiement public des frais d'inscription (Mobile Money) : INITIE la
     * transaction chez l'opérateur (statut PENDING). Le dossier n'est marqué
     * payé QUE lorsque le webhook opérateur signé confirme la transaction.
     * Le frontend suit l'issue via GET /dossiers/paiement/statut/{reference}.
     */
    @PostMapping("/dossiers/{numeroDossier}/payer")
    public ResponseEntity<?> payer(@PathVariable String numeroDossier,
                                   @RequestBody(required = false) Map<String, String> body) {
        try {
            String operateur = body != null ? body.get("operateur") : null;
            String telephone = body != null ? body.get("telephone") : null;
            if (operateur == null || operateur.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "L'opérateur est obligatoire"));
            }
            if (telephone == null || telephone.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Le numéro de téléphone est obligatoire"));
            }
            return ResponseEntity.ok(
                inscriptionPubliqueService.initierPaiementFraisInscription(numeroDossier, operateur, telephone));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    /**
     * Statut d'une transaction de frais de dossier (polling public après
     * initiation). Renvoie statut VALIDE / REJETE / EN_ATTENTE + paye.
     */
    @GetMapping("/dossiers/paiement/statut/{reference}")
    public ResponseEntity<?> statutPaiement(@PathVariable String reference) {
        try {
            return ResponseEntity.ok(inscriptionPubliqueService.getStatutPaiementDossier(reference));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", "Transaction non trouvée"));
        }
    }
}