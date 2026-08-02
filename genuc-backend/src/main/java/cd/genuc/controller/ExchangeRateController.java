package cd.genuc.controller;

import cd.genuc.dto.ExchangeRateUpdateDto;
import cd.genuc.model.ExchangeRate;
import cd.genuc.service.ExchangeRateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.Map;

/**
 * ExchangeRateController - REST API pour la gestion des taux de change
 */
@RestController
@RequestMapping("/api/v1/exchange-rates")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Exchange Rates", description = "Exchange rate management API")
public class ExchangeRateController {
    private final ExchangeRateService exchangeRateService;

    /**
     * Get current FC/USD exchange rate
     * GET /api/v1/exchange-rates/current
     */
    @GetMapping("/current")
    @Operation(summary = "Get current FC/USD exchange rate")
    public ResponseEntity<Map<String, Object>> getCurrentRate() {
        log.info("Fetching current exchange rate");
        BigDecimal rate = exchangeRateService.getCurrentExchangeRate();
        return ResponseEntity.ok(Map.of(
                "rate", rate,
                "from_currency", "FC",
                "to_currency", "USD"
        ));
    }

    /**
     * Convert FC to USD
     * GET /api/v1/exchange-rates/convert?amount=1000&from=FC&to=USD
     */
    @GetMapping("/convert")
    @Operation(summary = "Convert currency")
    public ResponseEntity<Map<String, Object>> convertCurrency(
            @RequestParam BigDecimal amount,
            @RequestParam(defaultValue = "FC") String from,
            @RequestParam(defaultValue = "USD") String to) {
        log.info("Converting: {} {} to {}", amount, from, to);

        BigDecimal result;
        if ("FC".equals(from) && "USD".equals(to)) {
            result = exchangeRateService.convertFcToUsd(amount);
        } else if ("USD".equals(from) && "FC".equals(to)) {
            result = exchangeRateService.convertUsdToFc(amount);
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Unsupported currency pair: " + from + "/" + to));
        }

        return ResponseEntity.ok(Map.of(
                "from_amount", amount,
                "from_currency", from,
                "to_amount", result,
                "to_currency", to
        ));
    }

    /**
     * Update exchange rate
     * POST /api/v1/exchange-rates/update
     */
    @PostMapping("/update")
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    @Operation(summary = "Update exchange rate")
    public ResponseEntity<Map<String, Object>> updateExchangeRate(
            @Valid @RequestBody ExchangeRateUpdateDto request) {
        log.info("Updating exchange rate: new_rate={}", request.getNewRate());

        ExchangeRate exchangeRate = exchangeRateService.updateExchangeRate(
                request.getNewRate(),
                request.getSource() != null ? request.getSource() : "MANUAL"
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "rate", exchangeRate.getRate(),
                        "effective_at", exchangeRate.getEffectiveAt(),
                        "source", exchangeRate.getSource()
                ));
    }
}
