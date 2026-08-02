package cd.genuc.service.kafka;

import cd.genuc.config.KafkaConfig;
import cd.genuc.dto.kafka.PdfGenerationEvent;
import cd.genuc.model.BonDePaiement;
import cd.genuc.model.Inscription;
import cd.genuc.model.Paiement;
import cd.genuc.repository.BonDePaiementRepository;
import cd.genuc.repository.PaiementRepository;
import cd.genuc.service.S3Service;
import cd.genuc.util.PdfGenerateur;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Génère les PDFs dans des threads Kafka dédiés (hors thread HTTP).
 *
 * Flux :
 *   1. Upload du PDF dans S3 (stockage durable, CDN CloudFront)
 *   2. Publication d'un NotificationEvent avec l'URL de téléchargement
 *   3. NotificationConsumer envoie l'email avec le lien (pas de pièce jointe lourde)
 *
 * Si S3 est désactivé (dev local), envoie le PDF directement en pièce jointe.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "genuc.kafka.enabled", havingValue = "true")
public class PdfGenerationConsumer {

    private final PdfGenerateur pdfGenerateur;
    private final NotificationProducer notificationProducer;
    private final BonDePaiementRepository bonRepo;
    private final PaiementRepository paiementRepo;
    private final S3Service s3Service;

    @Value("${aws.s3.enabled:false}")
    private boolean s3Enabled;

    @KafkaListener(
        topics = KafkaConfig.TOPIC_PDF_GENERATION,
        groupId = "pdf-generation-workers",
        containerFactory = "pdfListenerFactory"
    )
    public void traiter(PdfGenerationEvent event,
                        @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Génération PDF type={} id={} offset={}",
                 event.getTypeDocument(), event.getIdentifiant(), offset);

        try {
            switch (event.getTypeDocument()) {
                case BON_PAIEMENT  -> traiterBonPaiement(event);
                case RECU_PAIEMENT -> traiterRecuPaiement(event);
                default -> log.warn("Type PDF inconnu : {}", event.getTypeDocument());
            }
        } catch (Exception e) {
            log.error("Erreur génération PDF type={} id={} : {}",
                      event.getTypeDocument(), event.getIdentifiant(), e.getMessage());
            throw new RuntimeException("Retry PDF generation", e);
        }
    }

    @KafkaListener(
        topics = KafkaConfig.TOPIC_DLQ_PDF,
        groupId = "pdf-dlq-workers"
    )
    public void traiterDlq(PdfGenerationEvent event,
                           @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        log.error("PDF EN DLQ — type={} id={} dest={}",
                  event.getTypeDocument(), event.getIdentifiant(), event.getEmailDestinataire());
    }

    // ─── Bon de paiement ───────────────────────────────────────────────────

    private void traiterBonPaiement(PdfGenerationEvent event) throws Exception {
        BonDePaiement bon = bonRepo.findByNumero(event.getIdentifiant())
                .orElseThrow(() -> new RuntimeException("Bon introuvable : " + event.getIdentifiant()));

        Inscription inscription = bon.getInscription();
        byte[] pdf = pdfGenerateur.genererBonPaiement(buildBonData(bon, inscription));

        String sujet = "Bon de paiement GENUC - " + bon.getNumero();
        String nomFichier = "bon_paiement_" + bon.getNumero() + ".pdf";

        if (s3Enabled) {
            // Upload S3 → envoyer un lien CloudFront par email
            String cleS3 = S3Service.cleBonPaiement(
                    inscription != null && inscription.getUniversite() != null
                            ? inscription.getUniversite().getCode() : "GENUC",
                    bon.getNumero());

            String urlTelechargement = s3Service.uploadPdf(pdf, cleS3, nomFichier);

            String corps = buildCorpsBonAvecLien(bon, urlTelechargement);
            notificationProducer.envoyerEmail(event.getEmailDestinataire(), sujet, corps);

        } else {
            // Mode dev : pièce jointe directe
            notificationProducer.envoyerEmailAvecPdf(
                event.getEmailDestinataire(), sujet,
                buildCorpsBon(bon), pdf, nomFichier);
        }

        // SMS dans tous les cas
        if (event.getTelephone() != null && !event.getTelephone().isBlank()) {
            notificationProducer.envoyerSms(event.getTelephone(),
                "GENUC: Votre bon de paiement " + bon.getNumero() +
                " de " + bon.getMontant() + " USD est disponible. Expire le " +
                bon.getDateExpiration());
        }

        log.info("Bon {} traité (s3={})", bon.getNumero(), s3Enabled);
    }

    // ─── Reçu de paiement ──────────────────────────────────────────────────

    private void traiterRecuPaiement(PdfGenerationEvent event) throws Exception {
        Paiement paiement = paiementRepo.findByReference(event.getIdentifiant())
                .orElseThrow(() -> new RuntimeException("Paiement introuvable : " + event.getIdentifiant()));

        Inscription inscription = paiement.getInscription();
        byte[] pdf = pdfGenerateur.genererRecuPaiement(buildRecuData(paiement, inscription));

        String sujet = "Reçu de paiement GENUC - " + paiement.getReference();
        String nomFichier = "recu_paiement_" + paiement.getReference() + ".pdf";

        if (s3Enabled) {
            String cleS3 = S3Service.cleRecuPaiement(paiement.getReference());
            String urlTelechargement = s3Service.uploadPdf(pdf, cleS3, nomFichier);

            String corps = buildCorpsRecuAvecLien(paiement, urlTelechargement);
            notificationProducer.envoyerEmail(event.getEmailDestinataire(), sujet, corps);

        } else {
            notificationProducer.envoyerEmailAvecPdf(
                event.getEmailDestinataire(), sujet,
                buildCorpsRecu(paiement), pdf, nomFichier);
        }

        log.info("Reçu {} traité (s3={})", paiement.getReference(), s3Enabled);
    }

    // ─── Builders corps email ───────────────────────────────────────────────

    private String buildCorpsBon(BonDePaiement bon) {
        return "Bonjour,\n\nVeuillez trouver ci-joint votre bon de paiement.\n" +
               "Numéro : " + bon.getNumero() + "\n" +
               "Montant : " + bon.getMontant() + " USD\n" +
               "Date d'expiration : " + bon.getDateExpiration() + "\n\n" +
               "Présentez ce bon à la caisse pour effectuer votre paiement.\n\n" +
               "Cordialement,\nL'équipe GENUC";
    }

    private String buildCorpsBonAvecLien(BonDePaiement bon, String url) {
        return "Bonjour,\n\nVotre bon de paiement est prêt.\n\n" +
               "Numéro : " + bon.getNumero() + "\n" +
               "Montant : " + bon.getMontant() + " USD\n" +
               "Date d'expiration : " + bon.getDateExpiration() + "\n\n" +
               "Télécharger votre bon : " + url + "\n\n" +
               "Ce lien est valable 24 heures.\n" +
               "Présentez ce bon à la caisse pour effectuer votre paiement.\n\n" +
               "Cordialement,\nL'équipe GENUC";
    }

    private String buildCorpsRecu(Paiement paiement) {
        return "Bonjour,\n\nVeuillez trouver ci-joint votre reçu de paiement.\n" +
               "Référence : " + paiement.getReference() + "\n" +
               "Montant : " + paiement.getMontant() + " " + paiement.getDevise() + "\n\n" +
               "Cordialement,\nL'équipe GENUC";
    }

    private String buildCorpsRecuAvecLien(Paiement paiement, String url) {
        return "Bonjour,\n\nVotre reçu de paiement est disponible.\n\n" +
               "Référence : " + paiement.getReference() + "\n" +
               "Montant : " + paiement.getMontant() + " " + paiement.getDevise() + "\n\n" +
               "Télécharger votre reçu : " + url + "\n\n" +
               "Ce lien est valable 24 heures.\n\n" +
               "Cordialement,\nL'équipe GENUC";
    }

    // ─── Builders données PDF ───────────────────────────────────────────────

    private Map<String, Object> buildBonData(BonDePaiement bon, Inscription inscription) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("numero", bon.getNumero());
        data.put("montant", bon.getMontant());
        data.put("dateExpiration", bon.getDateExpiration().toString());
        if (inscription != null) {
            data.put("etudiant", inscription.getPrenom() + " " + inscription.getNom());
            data.put("matricule", inscription.getMatricule());
            if (inscription.getUniversite() != null) {
                data.put("universite", inscription.getUniversite().getNom());
            }
        }
        return data;
    }

    private Map<String, Object> buildRecuData(Paiement paiement, Inscription inscription) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("reference", paiement.getReference());
        data.put("montant", paiement.getMontant());
        data.put("devise", paiement.getDevise());
        data.put("date", paiement.getDateValidation() != null
                ? paiement.getDateValidation().toString() : "");
        if (inscription != null) {
            data.put("etudiant", inscription.getPrenom() + " " + inscription.getNom());
            data.put("matricule", inscription.getMatricule());
            if (inscription.getUniversite() != null) {
                data.put("universite", inscription.getUniversite().getNom());
            }
        }
        data.put("modePaiement", paiement.getModePaiement() != null
                ? paiement.getModePaiement().name() : "");
        data.put("typePaiement", paiement.getType() != null
                ? paiement.getType().name() : "");
        return data;
    }
}
