package cd.genuc.controller;

import cd.genuc.model.DossierInscription;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.InscriptionPubliqueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Portail restreint de l'étudiant dont le dossier attend des documents complémentaires.
 * Le compte est créé lors de la demande de documents par le secrétariat ; l'étudiant
 * n'a accès qu'à la consultation de son dossier et au téléversement des pièces demandées,
 * jusqu'à la validation de son inscription.
 */
@Slf4j
@RestController
@RequestMapping("/api/etudiant/mon-dossier")
@RequiredArgsConstructor
public class EtudiantDossierController {

    private final InscriptionPubliqueService inscriptionPubliqueService;

    /** État du dossier de l'étudiant connecté (documents demandés, déjà fournis, message). */
    @GetMapping
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> monDossier(@AuthenticationPrincipal Utilisateur user) {
        try {
            DossierInscription d = inscriptionPubliqueService.getMonDossierParEmail(user.getEmail());
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("numeroDossier", d.getNumeroDossier());
            r.put("statut", d.getStatut());
            r.put("documentsDemandes", d.getDocumentsDemandes());
            r.put("messageSecretaire", d.getMessageSecretaire());
            r.put("nom", d.getNom());
            r.put("prenom", d.getPrenom());

            Map<String, Boolean> fournis = new LinkedHashMap<>();
            fournis.put("urlPhoto", d.getUrlPhoto() != null);
            fournis.put("urlPhotoPasseport", d.getUrlPhotoPasseport() != null);
            fournis.put("urlDiplomeEtat", d.getUrlDiplomeEtat() != null);
            fournis.put("urlAttestationReussite", d.getUrlAttestationReussite() != null);
            fournis.put("urlReleveNotes", d.getUrlReleveNotes() != null);
            fournis.put("urlActeNaissance", d.getUrlActeNaissance() != null);
            fournis.put("urlAttestationNationalite", d.getUrlAttestationNationalite() != null);
            fournis.put("urlCarteIdentite", d.getUrlCarteIdentite() != null);
            fournis.put("urlLettreRecommandation", d.getUrlLettreRecommandation() != null);
            fournis.put("urlAttestationPhysique", d.getUrlAttestationPhysique() != null);
            fournis.put("urlAttestationConduite", d.getUrlAttestationConduite() != null);
            r.put("documentsFournis", fournis);
            return ResponseEntity.ok(r);
        } catch (RuntimeException e) {
            // Pas de dossier public rattaché (ex: étudiant déjà validé) → rien à compléter
            return ResponseEntity.ok(Map.of("statut", "AUCUN"));
        }
    }

    /** L'étudiant téléverse les documents demandés (multipart). */
    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> ajouterDocuments(
            @AuthenticationPrincipal Utilisateur user,
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

            DossierInscription d = inscriptionPubliqueService.ajouterDocuments(user.getEmail(), fichiers);
            return ResponseEntity.ok(Map.of(
                "message", "Documents envoyés. Votre dossier est de nouveau en cours d'examen.",
                "statut", d.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
