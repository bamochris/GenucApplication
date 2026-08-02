package cd.genuc.service;

import cd.genuc.dto.RegleSignatureDocumentDTO;
import cd.genuc.dto.SignataireUniversiteDTO;
import cd.genuc.dto.SignatureElectroniqueDTO;
import cd.genuc.model.*;
import cd.genuc.repository.RegleSignatureDocumentRepository;
import cd.genuc.repository.SignataireUniversiteRepository;
import cd.genuc.repository.SignatureElectroniqueRepository;
import cd.genuc.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Signature électronique des documents officiels (attestations, diplômes, lettres
 * d'acceptation...). Chaque université gère son propre registre de signataires habilités
 * ({@link SignataireUniversite}) et peut configurer, par type de document, quel signataire
 * s'applique par défaut ({@link RegleSignatureDocument}) — toujours modifiable au cas par cas
 * au moment de signer.
 */
@Service
@RequiredArgsConstructor
public class SignatureElectroniqueService {

    private final SignataireUniversiteRepository signataireRepo;
    private final RegleSignatureDocumentRepository regleRepo;
    private final SignatureElectroniqueRepository signatureRepo;
    private final UniversiteRepository universiteRepo;

    // ════════════════════════════════════════════════════════════════
    //  SIGNATAIRES
    // ════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<SignataireUniversiteDTO> listerSignataires(Long universiteId, boolean actifsSeuls) {
        List<SignataireUniversite> signataires = actifsSeuls
                ? signataireRepo.findByUniversiteIdAndActifTrueOrderByNomComplet(universiteId)
                : signataireRepo.findByUniversiteIdOrderByNomComplet(universiteId);
        return signataires.stream().map(SignataireUniversiteDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public SignataireUniversiteDTO creerSignataire(Long universiteId, String nomComplet, String fonction,
                                                     RoleEnum roleRattache, Long utilisateurId, String signatureImage) {
        Universite universite = universiteRepo.findById(universiteId)
                .orElseThrow(() -> new RuntimeException("Université introuvable : id=" + universiteId));

        if (nomComplet == null || nomComplet.isBlank()) {
            throw new RuntimeException("Le nom complet du signataire est obligatoire");
        }
        if (fonction == null || fonction.isBlank()) {
            throw new RuntimeException("La fonction du signataire est obligatoire");
        }

        SignataireUniversite signataire = SignataireUniversite.builder()
                .universite(universite)
                .nomComplet(nomComplet.trim())
                .fonction(fonction.trim())
                .roleRattache(roleRattache)
                .utilisateurId(utilisateurId)
                .signatureImage(signatureImage)
                .actif(true)
                .build();

        return SignataireUniversiteDTO.fromEntity(signataireRepo.save(signataire));
    }

    @Transactional
    public SignataireUniversiteDTO modifierSignataire(Long id, String nomComplet, String fonction,
                                                        RoleEnum roleRattache, Long utilisateurId,
                                                        String signatureImage, Boolean actif) {
        SignataireUniversite signataire = signataireRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Signataire introuvable : id=" + id));

        if (nomComplet != null && !nomComplet.isBlank()) signataire.setNomComplet(nomComplet.trim());
        if (fonction != null && !fonction.isBlank()) signataire.setFonction(fonction.trim());
        if (roleRattache != null) signataire.setRoleRattache(roleRattache);
        if (utilisateurId != null) signataire.setUtilisateurId(utilisateurId);
        if (signatureImage != null) signataire.setSignatureImage(signatureImage);
        if (actif != null) signataire.setActif(actif);

        return SignataireUniversiteDTO.fromEntity(signataireRepo.save(signataire));
    }

    @Transactional
    public void supprimerSignataire(Long id) {
        if (!signataireRepo.existsById(id)) {
            throw new RuntimeException("Signataire introuvable : id=" + id);
        }
        signataireRepo.deleteById(id);
    }

    // ════════════════════════════════════════════════════════════════
    //  RÈGLES PAR TYPE DE DOCUMENT
    // ════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<RegleSignatureDocumentDTO> listerRegles(Long universiteId) {
        return regleRepo.findByUniversiteId(universiteId)
                .stream().map(RegleSignatureDocumentDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public RegleSignatureDocumentDTO definirRegle(Long universiteId, TypeDocumentSignable typeDocument, Long signataireId) {
        Universite universite = universiteRepo.findById(universiteId)
                .orElseThrow(() -> new RuntimeException("Université introuvable : id=" + universiteId));
        SignataireUniversite signataire = signataireRepo.findById(signataireId)
                .orElseThrow(() -> new RuntimeException("Signataire introuvable : id=" + signataireId));
        if (!signataire.getUniversite().getId().equals(universiteId)) {
            throw new RuntimeException("Ce signataire n'appartient pas à cette université");
        }

        RegleSignatureDocument regle = regleRepo.findByUniversiteIdAndTypeDocument(universiteId, typeDocument)
                .orElse(RegleSignatureDocument.builder().universite(universite).typeDocument(typeDocument).build());
        regle.setSignataire(signataire);

        return RegleSignatureDocumentDTO.fromEntity(regleRepo.save(regle));
    }

    /**
     * Résout le signataire à utiliser pour signer un document : priorité à un choix manuel
     * explicite ({@code signataireIdOverride}), sinon la règle par défaut configurée pour
     * (université, typeDocument). Retourne {@code null} si aucun des deux n'est disponible —
     * le document est alors émis sans signature électronique (comportement précédent).
     */
    @Transactional(readOnly = true)
    public SignataireUniversite resoudreSignataire(Long universiteId, TypeDocumentSignable typeDocument, Long signataireIdOverride) {
        if (signataireIdOverride != null) {
            return signataireRepo.findById(signataireIdOverride)
                    .filter(s -> s.getUniversite().getId().equals(universiteId) && s.isActif())
                    .orElseThrow(() -> new RuntimeException("Signataire invalide ou inactif pour cette université"));
        }
        return regleRepo.findByUniversiteIdAndTypeDocument(universiteId, typeDocument)
                .map(RegleSignatureDocument::getSignataire)
                .filter(SignataireUniversite::isActif)
                .orElse(null);
    }

    // ════════════════════════════════════════════════════════════════
    //  SIGNATURE D'UN DOCUMENT
    // ════════════════════════════════════════════════════════════════

    /**
     * Appose une signature électronique sur un document déjà validé. {@code codeVerification}
     * doit être le code de vérification public déjà porté par le document (réutilise
     * l'UUID existant d'Attestation/LettreAcceptation plutôt que d'en créer un second).
     */
    @Transactional
    public SignatureElectroniqueDTO signer(TypeDocumentSignable typeDocument, Long documentId,
                                            SignataireUniversite signataire, String contenuCanonique,
                                            String codeVerification, Long appliqueParId, String appliqueParNom) {
        String hash = calculerHash(contenuCanonique);

        SignatureElectronique signature = SignatureElectronique.builder()
                .typeDocument(typeDocument)
                .documentId(documentId)
                .signataire(signataire)
                .appliqueParId(appliqueParId)
                .appliqueParNom(appliqueParNom)
                .hashDocument(hash)
                .codeVerification(codeVerification)
                .revoquee(false)
                .build();

        return SignatureElectroniqueDTO.fromEntity(signatureRepo.save(signature));
    }

    @Transactional(readOnly = true)
    public Optional<SignatureElectroniqueDTO> obtenirPourDocument(TypeDocumentSignable typeDocument, Long documentId) {
        return signatureRepo.findByTypeDocumentAndDocumentId(typeDocument, documentId)
                .map(SignatureElectroniqueDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public Optional<SignataireUniversite> obtenirSignataireEntitePourDocument(TypeDocumentSignable typeDocument, Long documentId) {
        return signatureRepo.findByTypeDocumentAndDocumentId(typeDocument, documentId)
                .map(SignatureElectronique::getSignataire);
    }

    @Transactional(readOnly = true)
    public SignatureElectroniqueDTO verifier(String codeVerification) {
        return signatureRepo.findByCodeVerification(codeVerification)
                .map(SignatureElectroniqueDTO::fromEntity)
                .orElseThrow(() -> new RuntimeException("Aucune signature électronique trouvée pour ce code"));
    }

    @Transactional
    public void revoquer(String codeVerification, String motif) {
        SignatureElectronique signature = signatureRepo.findByCodeVerification(codeVerification)
                .orElseThrow(() -> new RuntimeException("Aucune signature électronique trouvée pour ce code"));
        signature.setRevoquee(true);
        signature.setMotifRevocation(motif);
        signature.setDateRevocation(java.time.LocalDateTime.now());
        signatureRepo.save(signature);
    }

    private String calculerHash(String contenu) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(contenu.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hashBytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }
}
