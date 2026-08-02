package cd.genuc.service;

import cd.genuc.model.ExchangeRate;   // ✅ Correction du package
import cd.genuc.repository.ExchangeRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ExchangeRateService - Gestion des taux de change FC/USD
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ExchangeRateService {
    private final ExchangeRateRepository exchangeRateRepository;

    /**
     * Get current exchange rate FC -> USD
     */
    public BigDecimal getCurrentExchangeRate() {
        return exchangeRateRepository
                .findLatestActiveRate("FC", "USD")
                .map(ExchangeRate::getRate)
                .orElseThrow(() -> new IllegalStateException("No active exchange rate found"));
    }

    /**
     * Get exchange rate at specific date/time
     */
    public BigDecimal getExchangeRateAt(LocalDateTime dateTime) {
        return exchangeRateRepository
                .findLatestRateAsOf(dateTime)
                .map(ExchangeRate::getRate)
                .orElseThrow(() -> new IllegalStateException("No exchange rate found for date: " + dateTime));
    }

    /**
     * Convert FC to USD
     */
    public BigDecimal convertFcToUsd(BigDecimal amountFc) {
        BigDecimal rate = getCurrentExchangeRate();
        return amountFc.divide(rate, 2, RoundingMode.HALF_UP);
    }

    /**
     * Convert USD to FC
     */
    public BigDecimal convertUsdToFc(BigDecimal amountUsd) {
        BigDecimal rate = getCurrentExchangeRate();
        return amountUsd.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Update exchange rate (for manual updates)
     */
    public ExchangeRate updateExchangeRate(BigDecimal newRate, String source) {
        log.info("Updating exchange rate: FC/USD = {}, source = {}", newRate, source);

        // Deactivate old rate
        exchangeRateRepository.findLatestActiveRate("FC", "USD")
                .ifPresent(rate -> {
                    rate.setIsActive(false);
                    exchangeRateRepository.save(rate);
                });

        // Create new rate
        ExchangeRate exchangeRate = ExchangeRate.builder()
                .fromCurrency("FC")
                .toCurrency("USD")
                .rate(newRate)
                .source(source)
                .isActive(true)
                .rateDate(LocalDate.now())
                .effectiveAt(LocalDateTime.now())
                .build();

        return exchangeRateRepository.save(exchangeRate);
    }
}