package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * PaymentResponseDto - Response DTO for payment operations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponseDto {
    private Long transactionId;
    private String transactionCode;
    private BigDecimal amountFc;
    private BigDecimal amountUsd;
    private String paymentStatus;
    private String transactionStatus;
    private String paymentMethod;
    private LocalDateTime createdAt;
}
