package cd.genuc.service;

import cd.genuc.config.payment.*;
import cd.genuc.model.*;
import cd.genuc.repository.PaymentProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentProviderService {

    private final PaymentProviderRepository paymentProviderRepository;
    private final RestTemplate restTemplate;

    // ✅ Injection des métadonnées
    private final VodacomMpesaMetadata vodacomMpesa;
    private final AirtelMoneyMetadata airtelMoney;
    private final OrangeMoneyMetadata orangeMoney;
    private final AfriMoneyMetadata afriMoney;

    public String processTransaction(Transaction transaction) {
        log.info("Processing transaction through provider: method={}", transaction.getPaymentMethod());

        PaymentProvider provider = transaction.getPaymentProvider();
        if (provider == null) {
            throw new IllegalArgumentException("Payment provider not configured");
        }

        return switch (transaction.getPaymentMethod()) {
            case VODACOM_MPESA -> processVodacomMpesa(transaction, provider);
            case AIRTEL_MONEY -> processAirtelMoney(transaction, provider);
            case ORANGE_MONEY -> processOrangeMoney(transaction, provider);
            case AFRIMONEY -> processAfriMoney(transaction, provider);
            default -> throw new UnsupportedOperationException(
                    "Payment method not supported: " + transaction.getPaymentMethod()
            );
        };
    }

    // ─── Vodacom M-Pesa ──────────────────────────────────────────

    private String processVodacomMpesa(Transaction transaction, PaymentProvider provider) {
        log.info("Processing Vodacom M-Pesa payment: code={}", transaction.getTransactionCode());

        if (!vodacomMpesa.isConfigured()) {
            throw new IllegalStateException("Vodacom M-Pesa is not properly configured");
        }

        try {
            String url = vodacomMpesa.getApiUrl() + vodacomMpesa.getTransactionUrl();
            Map<String, Object> payload = buildVodacomPayload(transaction);

            log.debug("Vodacom URL: {}", url);
            log.debug("Vodacom payload: {}", payload);

            String response = restTemplate.postForObject(url, payload, String.class);
            log.info("Vodacom M-Pesa response: {}", response);
            return response;
        } catch (Exception e) {
            log.error("Vodacom M-Pesa API call failed", e);
            throw new RuntimeException("Vodacom M-Pesa processing failed", e);
        }
    }

    // ─── Airtel Money ─────────────────────────────────────────────

    private String processAirtelMoney(Transaction transaction, PaymentProvider provider) {
        log.info("Processing Airtel Money payment: code={}", transaction.getTransactionCode());

        if (!airtelMoney.isConfigured()) {
            throw new IllegalStateException("Airtel Money is not properly configured");
        }

        try {
            String url = airtelMoney.getApiUrl() + airtelMoney.getTransactionUrl();
            Map<String, Object> payload = buildGenericPayload(transaction, airtelMoney);

            log.debug("Airtel URL: {}", url);
            log.debug("Airtel payload: {}", payload);

            String response = restTemplate.postForObject(url, payload, String.class);
            log.info("Airtel Money response: {}", response);
            return response;
        } catch (Exception e) {
            log.error("Airtel Money API call failed", e);
            throw new RuntimeException("Airtel Money processing failed", e);
        }
    }

    // ─── Orange Money ─────────────────────────────────────────────

    private String processOrangeMoney(Transaction transaction, PaymentProvider provider) {
        log.info("Processing Orange Money payment: code={}", transaction.getTransactionCode());

        if (!orangeMoney.isConfigured()) {
            throw new IllegalStateException("Orange Money is not properly configured");
        }

        try {
            String url = orangeMoney.getApiUrl() + orangeMoney.getTransactionUrl();
            Map<String, Object> payload = buildGenericPayload(transaction, orangeMoney);

            log.debug("Orange URL: {}", url);
            log.debug("Orange payload: {}", payload);

            String response = restTemplate.postForObject(url, payload, String.class);
            log.info("Orange Money response: {}", response);
            return response;
        } catch (Exception e) {
            log.error("Orange Money API call failed", e);
            throw new RuntimeException("Orange Money processing failed", e);
        }
    }

    // ─── AfriMoney ────────────────────────────────────────────────

    private String processAfriMoney(Transaction transaction, PaymentProvider provider) {
        log.info("Processing AfriMoney payment: code={}", transaction.getTransactionCode());

        if (!afriMoney.isConfigured()) {
            throw new IllegalStateException("AfriMoney is not properly configured");
        }

        try {
            String url = afriMoney.getApiUrl() + afriMoney.getTransactionUrl();
            Map<String, Object> payload = buildGenericPayload(transaction, afriMoney);

            log.debug("AfriMoney URL: {}", url);
            log.debug("AfriMoney payload: {}", payload);

            String response = restTemplate.postForObject(url, payload, String.class);
            log.info("AfriMoney response: {}", response);
            return response;
        } catch (Exception e) {
            log.error("AfriMoney API call failed", e);
            throw new RuntimeException("AfriMoney processing failed", e);
        }
    }

    // ─── Méthodes de construction de payload ─────────────────────

    private Map<String, Object> buildVodacomPayload(Transaction transaction) {
        return Map.of(
                "amount", transaction.getAmountFc(),
                "currency", vodacomMpesa.getCurrency(),
                "reference", transaction.getTransactionCode(),
                "description", transaction.getDescription() != null ? transaction.getDescription() : "",
                "shortcode", vodacomMpesa.getMerchantCode(),
                "initiator", vodacomMpesa.getInitiatorName(),
                "environment", vodacomMpesa.getEnvironment()
        );
    }

    private Map<String, Object> buildGenericPayload(Transaction transaction, BasePaymentMetadata config) {
        return Map.of(
                "amount", transaction.getAmountFc(),
                "currency", config.getCurrency(),
                "reference", transaction.getTransactionCode(),
                "description", transaction.getDescription() != null ? transaction.getDescription() : "",
                "merchantCode", config.getMerchantCode(),
                "environment", config.getEnvironment()
        );
    }
}