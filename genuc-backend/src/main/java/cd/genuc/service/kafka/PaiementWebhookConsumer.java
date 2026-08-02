package cd.genuc.service.kafka;

import cd.genuc.config.KafkaConfig;
import cd.genuc.dto.kafka.NotificationEvent;
import cd.genuc.dto.kafka.PaiementWebhookEvent;
import cd.genuc.model.Paiement;
import cd.genuc.service.tachpay.MobileMoneyService;
import cd.genuc.service.tachpay.StripeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Consomme les webhooks des opérateurs Mobile Money et Stripe.
 * Le contrôleur publie dans Kafka et répond 200 immédiatement à l'opérateur.
 * Ce consumer traite ensuite la confirmation en arrière-plan :
 *  - Valide / rejette le paiement en DB
 *  - Met à jour les AffectationFrais
 *  - Envoie le reçu par email/SMS via NotificationProducer
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "genuc.kafka.enabled", havingValue = "true")
public class PaiementWebhookConsumer {

    private final MobileMoneyService mobileMoneyService;
    private final StripeService      stripeService;
    private final NotificationProducer notificationProducer;

    @KafkaListener(
        topics = KafkaConfig.TOPIC_WEBHOOKS,
        groupId = "webhook-workers",
        containerFactory = "webhookListenerFactory"
    )
    public void traiter(PaiementWebhookEvent event,
                        @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Traitement webhook provider={} id={} status={} offset={}",
                 event.getProvider(), event.getExternalId(), event.getStatus(), offset);

        try {
            Paiement paiement = switch (event.getProvider().toUpperCase()) {
                case "VODACOM", "AIRTEL", "ORANGE" ->
                    mobileMoneyService.confirmerPaiement(
                        event.getProvider(), event.getExternalId(),
                        event.getStatus(), event.getMessage());
                case "STRIPE" ->
                    stripeService.confirmerPaiement(
                        event.getExternalId(), event.getStatus(), event.getMessage());
                default -> {
                    log.error("Provider inconnu : {}", event.getProvider());
                    yield null;
                }
            };

            if (paiement != null && paiement.getStatut() == Paiement.StatutPaiement.VALIDE) {
                envoyerConfirmationEtudiant(paiement);
            } else if (paiement != null && paiement.getStatut() == Paiement.StatutPaiement.REJETE) {
                envoyerNotificationEchec(paiement);
            }

        } catch (Exception e) {
            log.error("Erreur traitement webhook provider={} id={} : {}",
                      event.getProvider(), event.getExternalId(), e.getMessage());
            throw new RuntimeException("Retry webhook", e);
        }
    }

    private void envoyerConfirmationEtudiant(Paiement paiement) {
        if (paiement.getInscription() == null) return;

        String email = paiement.getInscription().getEmail();
        String tel   = paiement.getInscription().getTelephone();
        String nom   = paiement.getInscription().getPrenom() + " "
                     + paiement.getInscription().getNom();

        if (email != null && !email.isBlank()) {
            notificationProducer.envoyerEmail(email,
                "Paiement confirmé - " + paiement.getReference(),
                String.format("""
                    Bonjour %s,

                    Votre paiement a été confirmé avec succès.

                    Référence : %s
                    Montant   : %.2f %s
                    Opérateur : %s
                    Date      : %s

                    Votre situation financière a été mise à jour.

                    Cordialement,
                    L'équipe GENUC
                    """,
                    nom,
                    paiement.getReference(),
                    paiement.getMontant(),
                    paiement.getDevise() != null ? paiement.getDevise() : "USD",
                    paiement.getOperateur(),
                    paiement.getDateValidation())
            );
        }

        if (tel != null && !tel.isBlank()) {
            notificationProducer.envoyerSms(tel,
                String.format("GENUC: Paiement %s de %.2f USD confirmé. Merci!",
                              paiement.getReference(), paiement.getMontant()));
        }
    }

    private void envoyerNotificationEchec(Paiement paiement) {
        if (paiement.getInscription() == null) return;

        String tel = paiement.getInscription().getTelephone();
        if (tel != null && !tel.isBlank()) {
            notificationProducer.envoyerSms(tel,
                String.format("GENUC: Paiement %s ÉCHOUÉ. Motif: %s. Réessayez ou contactez la caisse.",
                              paiement.getReference(), paiement.getMotifRejet()));
        }
    }
}
