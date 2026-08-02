package cd.genuc.service.kafka;

import cd.genuc.config.KafkaConfig;
import cd.genuc.dto.kafka.NotificationEvent;
import cd.genuc.dto.kafka.PaiementWebhookEvent;
import cd.genuc.dto.kafka.PdfGenerationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Publie des événements dans Kafka.
 * Tous les appels retournent immédiatement — le traitement est asynchrone.
 * Les services qui envoyaient des emails/SMS directement utilisent maintenant ce producer.
 *
 * <p><b>Respecte {@code genuc.kafka.enabled}.</b> {@link KafkaConfig} est déjà
 * conditionné par ce drapeau (false par défaut, donc en dev), mais les
 * {@code KafkaTemplate} viennent de l'auto-configuration Spring Boot et existent
 * quoi qu'il arrive : ce producteur publiait donc vers un courtier absent et
 * {@code KafkaTemplate.send} remontait {@code KafkaException("Send failed")} de
 * façon SYNCHRONE. Un appelant transactionnel voyait alors son travail annulé —
 * c'est ce qui rendait l'émission des bons de paiement impossible sans Kafka.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationProducer {

    private final KafkaTemplate<String, NotificationEvent> notifTemplate;
    private final KafkaTemplate<String, PaiementWebhookEvent> webhookTemplate;
    private final KafkaTemplate<String, PdfGenerationEvent> pdfTemplate;

    @org.springframework.beans.factory.annotation.Value("${genuc.kafka.enabled:false}")
    private boolean kafkaActif;

    /**
     * Exécute une publication seulement si Kafka est activé, et sans jamais laisser
     * remonter d'exception : aucune opération métier ne doit échouer parce qu'un
     * courtier est indisponible.
     */
    private void publier(String description, Runnable publication) {
        if (!kafkaActif) {
            log.debug("Kafka désactivé (genuc.kafka.enabled=false) — publication ignorée : {}", description);
            return;
        }
        try {
            publication.run();
        } catch (Exception e) {
            log.error("Publication Kafka impossible ({}) : {}", description, e.getMessage());
        }
    }

    // ─── Notifications ──────────────────────────────────────────────

    public void envoyerEmail(String destinataire, String sujet, String corps) {
        publierNotification(NotificationEvent.email(destinataire, sujet, corps));
    }

    public void envoyerEmailAvecPdf(String destinataire, String sujet,
                                     String corps, byte[] pdf, String nomFichier) {
        publierNotification(
            NotificationEvent.emailAvecPdf(destinataire, sujet, corps, pdf, nomFichier));
    }

    public void envoyerSms(String telephone, String message) {
        publierNotification(NotificationEvent.sms(telephone, message));
    }

    public void envoyerWhatsApp(String telephone, String message) {
        publierNotification(NotificationEvent.whatsapp(telephone, message));
    }

    private void publierNotification(NotificationEvent event) {
        publier("notification " + event.getType(), () -> {
            CompletableFuture<SendResult<String, NotificationEvent>> future =
                notifTemplate.send(KafkaConfig.TOPIC_NOTIFICATIONS,
                                   event.getDestinataire() != null
                                       ? event.getDestinataire() : event.getTelephone(),
                                   event);

            future.whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Échec publication notification type={} dest={} : {}",
                              event.getType(), event.getDestinataire(), ex.getMessage());
                } else {
                    log.debug("Notification publiée : type={} offset={}",
                              event.getType(), result.getRecordMetadata().offset());
                }
            });
        });
    }

    // ─── PDF asynchrone ────────────────────────────────────────────

    public void demanderBonPaiementPdf(String numeroBon, String email, String telephone) {
        publier("PDF bon " + numeroBon, () -> {
            PdfGenerationEvent event = PdfGenerationEvent.pourBon(numeroBon, email, telephone);
            CompletableFuture<SendResult<String, PdfGenerationEvent>> future =
                pdfTemplate.send(KafkaConfig.TOPIC_PDF_GENERATION, numeroBon, event);
            future.whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Échec demande PDF bon {} : {}", numeroBon, ex.getMessage());
                } else {
                    log.debug("Demande PDF bon {} publiée", numeroBon);
                }
            });
        });
    }

    public void demanderRecuPaiementPdf(String referencePaiement, String email) {
        publier("PDF reçu " + referencePaiement, () -> {
            PdfGenerationEvent event = PdfGenerationEvent.pourRecu(referencePaiement, email);
            CompletableFuture<SendResult<String, PdfGenerationEvent>> future =
                pdfTemplate.send(KafkaConfig.TOPIC_PDF_GENERATION, referencePaiement, event);
            future.whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Échec demande PDF reçu {} : {}", referencePaiement, ex.getMessage());
                } else {
                    log.debug("Demande PDF reçu {} publiée", referencePaiement);
                }
            });
        });
    }

    // ─── Webhooks paiement ──────────────────────────────────────────

    public void publierWebhookPaiement(String provider, String externalId,
                                        String status, String message) {
        publier("webhook " + provider + "/" + externalId, () -> {
            PaiementWebhookEvent event =
                PaiementWebhookEvent.of(provider, externalId, status, message);

            CompletableFuture<SendResult<String, PaiementWebhookEvent>> future =
                webhookTemplate.send(KafkaConfig.TOPIC_WEBHOOKS, externalId, event);

            future.whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Échec publication webhook provider={} id={} : {}",
                              provider, externalId, ex.getMessage());
                } else {
                    log.info("Webhook publié : provider={} id={} status={}",
                             provider, externalId, status);
                }
            });
        });
    }
}
