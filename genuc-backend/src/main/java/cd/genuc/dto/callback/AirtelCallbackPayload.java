package cd.genuc.dto.callback;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class AirtelCallbackPayload {

    private String transactionCode;
    private String providerReference;
    private String status;               // SUCCESS, FAILED, PENDING
    private BigDecimal amount;
    private String currency;
    private String customerPhone;
    private String merchantCode;
    private LocalDateTime transactionDate;
    private String responseCode;
    private String responseMessage;
    private String receiptNumber;

    // Getters et setters
}