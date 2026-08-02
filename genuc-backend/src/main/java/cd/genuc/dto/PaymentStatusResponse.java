package cd.genuc.dto;

import cd.genuc.model.PaymentStatusEnum;
import cd.genuc.model.TransactionStatusEnum;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentStatusResponse {

    private String transactionCode;
    private String providerTransactionId;
    private BigDecimal amountFC;
    private BigDecimal amountUSD;
    private PaymentStatusEnum paymentStatus;
    private TransactionStatusEnum transactionStatus;
    private String notes;
    private LocalDateTime initiatedAt;
    private LocalDateTime completedAt;
    private String message;
}