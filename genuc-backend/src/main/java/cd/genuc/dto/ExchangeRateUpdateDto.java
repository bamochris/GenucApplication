package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

/**
 * ExchangeRateUpdateDto - Request DTO for exchange rate update
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeRateUpdateDto {
    @NotNull(message = "New rate is required")
    @DecimalMin(value = "0.01")
    private BigDecimal newRate;

    private String source; // CENTRAL_BANK, MARKET, MANUAL
}
