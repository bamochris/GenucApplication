package cd.genuc.config.payment;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class OrangeMoneyMetadata extends BasePaymentMetadata {

    @Value("${orange.money.api.url:https://api.orange.com/orange-money/v1/payment}")
    private String apiUrl;

    @Value("${orange.money.transaction.url:}")
    private String transactionUrl;

    @Value("${orange.money.merchant.code:default}")
    private String merchantCode;

    @Value("${orange.money.environment:sandbox}")
    private String environment;

    @Value("${orange.money.client.id:}")
    private String clientId;

    @Value("${orange.money.client.secret:}")
    private String clientSecret;

    @Override
    public String getCurrency() {
        return "CDF";
    }
}
