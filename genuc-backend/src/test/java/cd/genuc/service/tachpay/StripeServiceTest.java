package cd.genuc.service.tachpay;

import cd.genuc.repository.AffectationFraisRepository;
import cd.genuc.repository.PaiementRepository;
import cd.genuc.repository.TransactionExterneRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class StripeServiceTest {

    @Mock private PaiementRepository paiementRepo;
    @Mock private TransactionExterneRepository transactionExterneRepo;
    @Mock private AffectationFraisRepository affectationRepo;

    private StripeService service;

    @BeforeEach
    void setUp() {
        service = new StripeService(paiementRepo, transactionExterneRepo, affectationRepo);
    }

    @Test
    void creerSessionCheckout_sansCleEtSimulationDesactivee_rejetteAuLieuDeSimuler() {
        ReflectionTestUtils.setField(service, "stripeApiKey", "");
        ReflectionTestUtils.setField(service, "simulationCarteActive", false);

        assertThatThrownBy(() -> service.creerSessionCheckout(
            50.0, "USD", "https://genuc.cd/success", "https://genuc.cd/cancel", "Test"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Stripe non configuré");
    }

    @Test
    void creerSessionCheckout_simulationExplicite_retourneSessionFictive() {
        ReflectionTestUtils.setField(service, "stripeApiKey", "");
        ReflectionTestUtils.setField(service, "simulationCarteActive", true);

        StripeService.StripeSession session = service.creerSessionCheckout(
            50.0, "USD", "https://genuc.cd/success", "https://genuc.cd/cancel", "Test");

        assertThat(session.id()).startsWith("cs_test_");
        assertThat(session.url()).contains("session_id=cs_test_");
    }

    @Test
    void signatureWebhookValide_secretManquantEtObligatoire_rejette() {
        ReflectionTestUtils.setField(service, "webhookSecret", "");
        ReflectionTestUtils.setField(service, "webhookSignatureObligatoire", true);

        assertThat(service.signatureWebhookValide("{}", null)).isFalse();
    }

    @Test
    void signatureWebhookValide_devSansSecret_accepte() {
        ReflectionTestUtils.setField(service, "webhookSecret", "");
        ReflectionTestUtils.setField(service, "webhookSignatureObligatoire", false);

        assertThat(service.signatureWebhookValide("{}", null)).isTrue();
    }
}