package cd.genuc.dto.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Événement publié dans Kafka pour déclencher la génération d'un PDF
 * dans un thread dédié, hors du thread HTTP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfGenerationEvent {

    public enum TypeDocument {
        BON_PAIEMENT,
        RECU_PAIEMENT
    }

    private TypeDocument typeDocument;

    /** Identifiant métier : numéro du bon ou référence du paiement */
    private String identifiant;

    /** Destinataire email du document généré */
    private String emailDestinataire;

    /** Numéro de téléphone pour SMS de confirmation (peut être null) */
    private String telephone;

    private LocalDateTime creeLe;

    public static PdfGenerationEvent pourBon(String numeroBon, String email, String telephone) {
        return PdfGenerationEvent.builder()
                .typeDocument(TypeDocument.BON_PAIEMENT)
                .identifiant(numeroBon)
                .emailDestinataire(email)
                .telephone(telephone)
                .creeLe(LocalDateTime.now())
                .build();
    }

    public static PdfGenerationEvent pourRecu(String referencePaiement, String email) {
        return PdfGenerationEvent.builder()
                .typeDocument(TypeDocument.RECU_PAIEMENT)
                .identifiant(referencePaiement)
                .emailDestinataire(email)
                .telephone(null)
                .creeLe(LocalDateTime.now())
                .build();
    }
}
