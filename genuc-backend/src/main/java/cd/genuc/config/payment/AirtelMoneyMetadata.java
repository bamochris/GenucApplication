package cd.genuc.config.payment;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class AirtelMoneyMetadata extends BasePaymentMetadata {

    @Value("${airtel.money.api.url:https://api.airtel.africa/money/v1/payment}")
    private String apiUrl;

    @Value("${airtel.money.transaction.url:}")
    private String transactionUrl;

    @Value("${airtel.money.merchant.code:default}")
    private String merchantCode;

    @Value("${airtel.money.environment:sandbox}")
    private String environment;

    @Value("${airtel.money.client.id:}")
    private String clientId;

    @Value("${airtel.money.client.secret:}")
    private String clientSecret;

    @Override
    public String getCurrency() {
        return "CDF";
    }
}
