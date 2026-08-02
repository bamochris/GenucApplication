package cd.genuc.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.time.Duration;

/**
 * Stocke les PDFs générés (bons, reçus, attestations) dans AWS S3.
 * Les URLs pré-signées CloudFront sont valables 24h — l'étudiant
 * reçoit un lien sécurisé par email plutôt qu'une pièce jointe lourde.
 *
 * Avantages :
 *   - Email plus léger (pas de PDF en base64 dans le message)
 *   - Téléchargement direct depuis CloudFront (CDN mondial)
 *   - Accès révocable (lien expirant)
 *   - Stockage durable et répliqué (S3 11×9 durabilité)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket:genuc-documents}")
    private String bucket;

    @Value("${aws.cloudfront.domain:}")
    private String cloudfrontDomain;

    @Value("${aws.s3.presigned-url-expiry-hours:24}")
    private int presignedUrlExpiryHours;

    /**
     * Upload un PDF dans S3 et retourne l'URL de téléchargement.
     * Si CloudFront est configuré → URL CloudFront (CDN rapide).
     * Sinon → URL pré-signée S3 directe (valable 24h).
     */
    public String uploadPdf(byte[] pdfBytes, String key, String contentDispositionFilename) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType("application/pdf")
                .contentDisposition("attachment; filename=\"" + contentDispositionFilename + "\"")
                .serverSideEncryption("AES256")
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(pdfBytes));
        log.info("PDF uploadé dans S3 : s3://{}/{}", bucket, key);

        return cloudfrontDomain.isBlank()
                ? genererUrlPresignee(key)
                : genererUrlCloudFront(key);
    }

    /**
     * Upload un fichier arbitraire (support de cours, pièce jointe, etc.) dans S3
     * et retourne l'URL de téléchargement. Contrairement à {@link #uploadPdf},
     * accepte n'importe quel content-type (PDF, vidéo, document, présentation...).
     */
    public String uploadFile(byte[] bytes, String key, String contentType, String contentDispositionFilename) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType != null ? contentType : "application/octet-stream")
                .contentDisposition("attachment; filename=\"" + contentDispositionFilename + "\"")
                .serverSideEncryption("AES256")
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(bytes));
        log.info("Fichier uploadé dans S3 : s3://{}/{}", bucket, key);

        return cloudfrontDomain.isBlank()
                ? genererUrlPresignee(key)
                : genererUrlCloudFront(key);
    }

    /**
     * Génère une URL pré-signée S3 valable {@code presignedUrlExpiryHours} heures.
     * Utilisée en dev ou si CloudFront n'est pas configuré.
     */
    public String genererUrlPresignee(String key) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(presignedUrlExpiryHours))
                .getObjectRequest(GetObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .build())
                .build();

        String url = s3Presigner.presignGetObject(presignRequest).url().toString();
        log.debug("URL pré-signée générée pour {} (expire dans {}h)", key, presignedUrlExpiryHours);
        return url;
    }

    /**
     * Construit une URL CloudFront signée.
     * En prod : CloudFront est configuré avec une politique d'accès restreinte.
     */
    private String genererUrlCloudFront(String key) {
        return "https://" + cloudfrontDomain + "/" + key;
    }

    /**
     * Supprime un document (ex: après expiration du bon de paiement).
     */
    public void supprimerDocument(String key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
            log.info("Document supprimé de S3 : {}", key);
        } catch (Exception e) {
            log.error("Erreur suppression S3 key={} : {}", key, e.getMessage());
        }
    }

    /**
     * Construit la clé S3 pour un bon de paiement.
     * Format : documents/bons/2026/06/BON-UNIKIN-20260629-ABC123.pdf
     */
    public static String cleBonPaiement(String universiteCode, String numero) {
        java.time.LocalDate now = java.time.LocalDate.now();
        return String.format("documents/bons/%d/%02d/%s.pdf",
                now.getYear(), now.getMonthValue(), numero);
    }

    /**
     * Construit la clé S3 pour un reçu de paiement.
     */
    public static String cleRecuPaiement(String reference) {
        java.time.LocalDate now = java.time.LocalDate.now();
        return String.format("documents/recus/%d/%02d/%s.pdf",
                now.getYear(), now.getMonthValue(), reference);
    }

    /**
     * Construit la clé S3 pour une attestation d'inscription.
     */
    public static String cleAttestation(Long inscriptionId, String annee) {
        return String.format("documents/attestations/%s/inscription-%d.pdf",
                annee, inscriptionId);
    }

    /**
     * Construit la clé S3 pour un support de cours déposé par un professeur.
     */
    public static String cleSupportCours(Long coursId, String nomFichierOriginal) {
        String nom = (nomFichierOriginal != null && !nomFichierOriginal.isBlank())
                ? nomFichierOriginal : "fichier";
        return String.format("documents/supports/cours-%d/%s-%s",
                coursId, java.util.UUID.randomUUID(), nom);
    }

    /**
     * Construit la clé S3 pour une pièce jointe de demande d'équivalence de diplôme.
     */
    public static String cleEquivalenceDiplome(Long etudiantId, String type, String nomFichierOriginal) {
        String nom = (nomFichierOriginal != null && !nomFichierOriginal.isBlank())
                ? nomFichierOriginal : "fichier";
        return String.format("documents/equivalences/etudiant-%d/%s-%s-%s",
                etudiantId, type, java.util.UUID.randomUUID(), nom);
    }
}
