package cd.genuc.config.payment;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class VodacomMpesaMetadata extends BasePaymentMetadata {

    @Value("${vodacom.mpesa.api.url:https://sandbox.mpesa.vodacom.com/v1/payment}")
    private String apiUrl;

    @Value("${vodacom.mpesa.transaction.url:}")
    private String transactionUrl;

    @Value("${vodacom.mpesa.shortcode:default}")
    private String merchantCode;

    @Value("${vodacom.mpesa.environment:sandbox}")
    private String environment;

    @Value("${vodacom.mpesa.initiator.name:}")
    private String initiatorName;

    @Value("${vodacom.mpesa.consumer.key:}")
    private String consumerKey;

    @Value("${vodacom.mpesa.consumer.secret:}")
    private String consumerSecret;

    @Override
    public String getCurrency() {
        return "CDF";
    }
}
