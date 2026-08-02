package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * ReconciliationCreateDto - Request DTO for creating reconciliation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationCreateDto {
    @NotNull(message = "University ID is required")
    private Long universiteId;

    @NotNull(message = "Bank statement date is required")
    private LocalDate bankStatementDate;

    @NotNull(message = "Total expected amount is required")
    @DecimalMin(value = "0.01")
    private BigDecimal totalExpected;

    @NotNull(message = "Total received amount is required")
    @DecimalMin(value = "0.00")
    private BigDecimal totalReceived;
}
