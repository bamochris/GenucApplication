package cd.genuc.config.payment;

public abstract class BasePaymentMetadata {

    public abstract String getApiUrl();
    public abstract String getTransactionUrl();
    public abstract String getCurrency();
    public abstract String getMerchantCode();
    public abstract String getEnvironment();

    public boolean isConfigured() {
        String url = getApiUrl();
        return url != null && !url.isBlank() && !url.contains("dummy");
    }
}
