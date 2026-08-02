package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * PaymentRequestDto - Request DTO for payment initiation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequestDto {
    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "University ID is required")
    private Long universiteId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amountFc;

    @NotBlank(message = "Transaction type is required")
    private String transactionType; // TUITION, ACCOMMODATION, etc.

    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // VODACOM_MPESA, AIRTEL_MONEY, ORANGE_MONEY, etc.

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
}
