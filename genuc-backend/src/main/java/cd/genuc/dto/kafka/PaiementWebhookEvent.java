package cd.genuc.dto.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Événement publié dans "genuc.paiements.webhooks" quand un opérateur
 * mobile money confirme (ou rejette) une transaction.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaiementWebhookEvent {

    private String provider;        // VODACOM, AIRTEL, ORANGE, STRIPE
    private String externalId;      // ID fourni par l'opérateur
    private String status;          // SUCCESS, FAILED, PENDING
    private String message;         // Message brut de l'opérateur
    private LocalDateTime reçuLe;

    public static PaiementWebhookEvent of(String provider, String externalId,
                                          String status, String message) {
        return PaiementWebhookEvent.builder()
                .provider(provider)
                .externalId(externalId)
                .status(status)
                .message(message)
                .reçuLe(LocalDateTime.now())
                .build();
    }
}
