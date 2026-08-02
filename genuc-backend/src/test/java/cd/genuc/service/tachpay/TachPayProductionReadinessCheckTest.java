package cd.genuc.service.tachpay;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TachPayProductionReadinessCheckTest {

    @Test
    void verifierConfigurationProduction_horsProfilProd_ignoreLesValeursManquantes() {
        MockEnvironment environment = new MockEnvironment();

        assertThatCode(() -> new TachPayProductionReadinessCheck(environment)
            .verifierConfigurationProduction()).doesNotThrowAnyException();
    }

    @Test
    void verifierConfigurationProduction_prodIncomplet_rejetteAuDemarrage() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");

        assertThatThrownBy(() -> new TachPayProductionReadinessCheck(environment)
            .verifierConfigurationProduction())
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Configuration TachPay production incomplete")
            .hasMessageContaining("genuc.webhook.vodacom.secret")
            .hasMessageContaining("stripe.api.key");
    }

    @Test
    void verifierConfigurationProduction_prodComplet_accepte() {
        MockEnvironment environment = configurationProductionComplete();

        assertThatCode(() -> new TachPayProductionReadinessCheck(environment)
            .verifierConfigurationProduction()).doesNotThrowAnyException();
    }

    private MockEnvironment configurationProductionComplete() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        environment.setProperty("genuc.payment.mobile-money.simulation-enabled", "false");
        environment.setProperty("genuc.payment.card.simulation-enabled", "false");
        environment.setProperty("genuc.webhook.require-signature", "true");
        environment.setProperty("stripe.webhook.require-signature", "true");
        environment.setProperty("genuc.webhook.public-base-url", "https://api.genuc.cd");
        environment.setProperty("genuc.webhook.vodacom.secret", "secret-vodacom");
        environment.setProperty("genuc.webhook.airtel.secret", "secret-airtel");
        environment.setProperty("genuc.webhook.orange.secret", "secret-orange");
        environment.setProperty("genuc.webhook.afrimoney.secret", "secret-afrimoney");
        environment.setProperty("vodacom.mpesa.api.url", "https://pay.example.test/vodacom");
        environment.setProperty("vodacom.mpesa.api.key", "vodacom-key");
        environment.setProperty("vodacom.mpesa.api.secret", "vodacom-secret");
        environment.setProperty("vodacom.mpesa.shortcode", "123456");
        environment.setProperty("airtel.money.api.url", "https://pay.example.test/airtel");
        environment.setProperty("airtel.money.api.key", "airtel-key");
        environment.setProperty("airtel.money.api.secret", "airtel-secret");
        environment.setProperty("airtel.money.merchant.code", "AIRTEL-MERCHANT");
        environment.setProperty("orange.money.api.url", "https://pay.example.test/orange");
        environment.setProperty("orange.money.api.key", "orange-key");
        environment.setProperty("orange.money.api.secret", "orange-secret");
        environment.setProperty("orange.money.merchant.code", "ORANGE-MERCHANT");
        environment.setProperty("afrimoney.api.url", "https://pay.example.test/afrimoney");
        environment.setProperty("afrimoney.client.id", "afrimoney-key");
        environment.setProperty("afrimoney.client.secret", "afrimoney-secret");
        environment.setProperty("afrimoney.merchant.code", "AFRI-MERCHANT");
        environment.setProperty("stripe.api.key", "sk_live_test");
        environment.setProperty("stripe.webhook-secret", "whsec_test");
        return environment;
    }
}