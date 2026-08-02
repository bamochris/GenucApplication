package cd.genuc.dto.callback;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class VodacomCallbackPayload {

    private String transactionCode;      // Référence générée par GENUC
    private String providerReference;    // Référence du provider
    private String status;               // SUCCESS, FAILED, PENDING
    private BigDecimal amount;
    private String currency;
    private String transactionType;
    private String customerPhone;
    private String merchantShortcode;
    private LocalDateTime transactionDate;
    private String resultCode;           // 0 = succès
    private String resultDescription;
    private String receiptNumber;

    // Getters et setters (Lombok @Data les génère)
}