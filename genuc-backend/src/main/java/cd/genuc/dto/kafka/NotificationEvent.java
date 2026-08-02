package cd.genuc.dto.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Événement publié dans le topic Kafka "genuc.notifications".
 * Consommé par NotificationConsumer pour envoyer emails et SMS
 * de façon asynchrone sans bloquer le thread HTTP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {

    public enum Type { EMAIL, SMS, EMAIL_AVEC_PDF, WHATSAPP }

    private Type type;

    // Email
    private String destinataire;
    private String sujet;
    private String corps;

    // PDF joint (base64 si email avec pièce jointe)
    private String pdfBase64;
    private String pdfNomFichier;

    // SMS / WhatsApp
    private String telephone;
    private String smsMessage;

    // Métadonnées
    private String reference;
    private LocalDateTime creeLe;
    private int tentatives;

    // Factories pour simplifier la création
    public static NotificationEvent email(String dest, String sujet, String corps) {
        return NotificationEvent.builder()
                .type(Type.EMAIL)
                .destinataire(dest)
                .sujet(sujet)
                .corps(corps)
                .creeLe(LocalDateTime.now())
                .build();
    }

    public static NotificationEvent emailAvecPdf(String dest, String sujet,
                                                  String corps, byte[] pdf, String nomFichier) {
        return NotificationEvent.builder()
                .type(Type.EMAIL_AVEC_PDF)
                .destinataire(dest)
                .sujet(sujet)
                .corps(corps)
                .pdfBase64(pdf != null ? java.util.Base64.getEncoder().encodeToString(pdf) : null)
                .pdfNomFichier(nomFichier)
                .creeLe(LocalDateTime.now())
                .build();
    }

    public static NotificationEvent sms(String telephone, String message) {
        return NotificationEvent.builder()
                .type(Type.SMS)
                .telephone(telephone)
                .smsMessage(message)
                .creeLe(LocalDateTime.now())
                .build();
    }

    public static NotificationEvent whatsapp(String telephone, String message) {
        return NotificationEvent.builder()
                .type(Type.WHATSAPP)
                .telephone(telephone)
                .smsMessage(message)
                .creeLe(LocalDateTime.now())
                .build();
    }
}
