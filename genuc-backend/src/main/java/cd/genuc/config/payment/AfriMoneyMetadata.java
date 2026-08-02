package cd.genuc.config.payment;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class AfriMoneyMetadata extends BasePaymentMetadata {

    @Value("${afrimoney.api.url:https://api.afrimoney.cd/v1/payment}")
    private String apiUrl;

    @Value("${afrimoney.transaction.url:}")
    private String transactionUrl;

    @Value("${afrimoney.merchant.code:default}")
    private String merchantCode;

    @Value("${afrimoney.environment:sandbox}")
    private String environment;

    @Value("${afrimoney.client.id:}")
    private String clientId;

    @Value("${afrimoney.client.secret:}")
    private String clientSecret;

    @Override
    public String getCurrency() {
        return "CDF";
    }
}
