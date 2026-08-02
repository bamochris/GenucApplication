package cd.genuc.service.kafka;

import cd.genuc.config.KafkaConfig;
import cd.genuc.dto.kafka.NotificationEvent;
import cd.genuc.service.EmailService;
import cd.genuc.service.SmsService;
import cd.genuc.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.Base64;

/**
 * Consomme les événements du topic "genuc.notifications" et envoie
 * emails / SMS dans des threads dédiés, sans bloquer les threads HTTP.
 *
 * 10 threads consommateurs en parallèle (configurable dans KafkaConfig).
 * En cas d'échec : retry 3× avec 2s d'intervalle, puis Dead Letter Queue.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "genuc.kafka.enabled", havingValue = "true")
public class NotificationConsumer {

    private final EmailService emailService;
    private final SmsService   smsService;
    private final WhatsAppService whatsAppService;

    @KafkaListener(
        topics = KafkaConfig.TOPIC_NOTIFICATIONS,
        groupId = "notification-workers",
        containerFactory = "notificationListenerFactory"
    )
    public void traiter(NotificationEvent event,
                        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                        @Header(KafkaHeaders.OFFSET) long offset) {

        log.debug("Traitement notification type={} offset={}", event.getType(), offset);

        try {
            switch (event.getType()) {
                case EMAIL -> traiterEmail(event);
                case EMAIL_AVEC_PDF -> traiterEmailAvecPdf(event);
                case SMS -> traiterSms(event);
                case WHATSAPP -> traiterWhatsApp(event);
                default -> log.warn("Type de notification inconnu : {}", event.getType());
            }
        } catch (Exception e) {
            log.error("Erreur traitement notification type={} dest={} : {}",
                      event.getType(), event.getDestinataire(), e.getMessage());
            throw new RuntimeException("Échec notification — retry automatique", e);
        }
    }

    private void traiterEmail(NotificationEvent event) throws Exception {
        if (event.getDestinataire() == null || event.getDestinataire().isBlank()) {
            log.warn("Notification EMAIL sans destinataire — ignorée");
            return;
        }
        emailService.envoyerEmail(
            event.getDestinataire(),
            event.getSujet(),
            event.getCorps()
        );
        log.info("Email envoyé à {}", event.getDestinataire());
    }

    private void traiterEmailAvecPdf(NotificationEvent event) throws Exception {
        if (event.getDestinataire() == null || event.getPdfBase64() == null) {
            log.warn("Notification EMAIL_AVEC_PDF incomplète — ignorée");
            return;
        }
        byte[] pdf = Base64.getDecoder().decode(event.getPdfBase64());
        emailService.envoyerAvecPieceJointe(
            event.getDestinataire(),
            event.getSujet(),
            event.getCorps(),
            pdf,
            event.getPdfNomFichier()
        );
        log.info("Email avec PDF envoyé à {} ({})", event.getDestinataire(), event.getPdfNomFichier());
    }

    private void traiterSms(NotificationEvent event) {
        if (event.getTelephone() == null || event.getTelephone().isBlank()) {
            log.warn("Notification SMS sans numéro de téléphone — ignorée");
            return;
        }
        smsService.envoyerSms(event.getTelephone(), event.getSmsMessage());
        log.info("SMS envoyé à {}", event.getTelephone());
    }

    private void traiterWhatsApp(NotificationEvent event) {
        if (event.getTelephone() == null || event.getTelephone().isBlank()) {
            log.warn("Notification WHATSAPP sans numéro de téléphone — ignorée");
            return;
        }
        whatsAppService.envoyerMessage(event.getTelephone(), event.getSmsMessage());
        log.info("Message WhatsApp envoyé à {}", event.getTelephone());
    }

    // ─── Dead Letter Queue : messages qui ont échoué 3 fois ─────────
    @KafkaListener(
        topics = KafkaConfig.TOPIC_DLQ_NOTIFICATIONS,
        groupId = "notification-dlq-workers"
    )
    public void traiterDlq(NotificationEvent event,
                           @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        log.error("NOTIFICATION EN DLQ — type={} dest={} tel={} ref={}",
                  event.getType(), event.getDestinataire(),
                  event.getTelephone(), event.getReference());
        // Ici : alerter l'équipe (dashboard admin, Slack, etc.)
        // Pour l'instant : log critique pour investigation manuelle
    }
}
