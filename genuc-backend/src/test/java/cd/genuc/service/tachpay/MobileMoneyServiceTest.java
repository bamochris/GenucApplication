package cd.genuc.service.tachpay;

import cd.genuc.repository.AffectationFraisRepository;
import cd.genuc.repository.PaiementRepository;
import cd.genuc.repository.TransactionExterneRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.web.reactive.function.client.WebClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class MobileMoneyServiceTest {

    @Mock private PaiementRepository paiementRepo;
    @Mock private TransactionExterneRepository transactionExterneRepo;
    @Mock private AffectationFraisRepository affectationRepo;
    @Mock private WebClient webClient;

    private MockEnvironment environment;
    private MobileMoneyService service;

    @BeforeEach
    void setUp() {
        environment = new MockEnvironment();
        service = new MobileMoneyService(
            paiementRepo, transactionExterneRepo, affectationRepo, webClient, environment, new ObjectMapper());
    }

    @Test
    void initierChargeOperateur_simulationExplicite_genereIdentifiantLocalSansAppelHttp() {
        environment.setProperty("genuc.payment.mobile-money.simulation-enabled", "true");

        String externalId = service.initierChargeOperateur("VODACOM", "+243820000000", 50.0, "REF-1");

        assertThat(externalId).startsWith("VOD_");
        verifyNoInteractions(webClient);
    }

    @Test
    void initierChargeOperateur_sansSimulationEtConfigManquante_rejetteAuLieuDeSimuler() {
        environment.setProperty("genuc.payment.mobile-money.simulation-enabled", "false");

        assertThatThrownBy(() -> service.initierChargeOperateur("VODACOM", "+243820000000", 50.0, "REF-1"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("VODACOM non configuré");

        verifyNoInteractions(webClient);
    }

    @Test
    void initierChargeOperateur_rejetteLesValeursDemoEnModeReel() {
        environment.setProperty("genuc.payment.mobile-money.simulation-enabled", "false");
        environment.setProperty("vodacom.mpesa.api.url", "https://payments.example.test/vodacom");
        environment.setProperty("vodacom.mpesa.api.key", "dummy_key");
        environment.setProperty("vodacom.mpesa.api.secret", "dummy_secret");
        environment.setProperty("vodacom.mpesa.shortcode", "171717");

        assertThatThrownBy(() -> service.initierChargeOperateur("VODACOM", "+243820000000", 50.0, "REF-1"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("identifiant API");

        verifyNoInteractions(webClient);
    }

    @Test
    void initierChargeOperateur_afriMoneySimulationExposeOperateurDuCheckout() {
        environment.setProperty("genuc.payment.mobile-money.simulation-enabled", "true");

        String externalId = service.initierChargeOperateur("AFRIMONEY", "+243800000000", 50.0, "REF-2");

        assertThat(externalId).startsWith("AFR_");
        verifyNoInteractions(webClient);
    }

    @Test
    void initierChargeOperateur_orangeSansSecretOAuth_rejetteAvantAppelHttp() {
        environment.setProperty("genuc.payment.mobile-money.simulation-enabled", "false");
        environment.setProperty("orange.money.api.url", "https://payments.example.test/orange");
        environment.setProperty("orange.money.api.key", "orange-client");
        environment.setProperty("orange.money.api.secret", "");
        environment.setProperty("orange.money.merchant.code", "ORANGE-MERCHANT");

        assertThatThrownBy(() -> service.initierChargeOperateur("ORANGE", "+243850000000", 50.0, "REF-3"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("secret API");

        verifyNoInteractions(webClient);
    }
}