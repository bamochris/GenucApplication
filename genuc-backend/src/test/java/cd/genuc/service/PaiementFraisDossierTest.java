package cd.genuc.service;

import cd.genuc.model.DossierInscription;
import cd.genuc.model.TransactionDossier;
import cd.genuc.repository.DossierInscriptionRepository;
import cd.genuc.repository.TransactionDossierRepository;
import cd.genuc.service.tachpay.MobileMoneyService;
import cd.genuc.service.tachpay.StripeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Paiement PUBLIC des frais de dossier — invariants de sécurité :
 *   - l'initiation ne marque JAMAIS le dossier payé (transaction PENDING) ;
 *   - seul le webhook SUCCESS marque le dossier payé ;
 *   - un webhook FAILED ne marque rien ;
 *   - les webhooks rejoués (transaction terminale) sont ignorés (idempotence).
 */
@ExtendWith(MockitoExtension.class)
class PaiementFraisDossierTest {

    @Mock private DossierInscriptionRepository dossierRepo;
    @Mock private TransactionDossierRepository transactionDossierRepo;
    @Mock private MobileMoneyService mobileMoneyService;
    @Mock private StripeService stripeService;

    @InjectMocks
    private InscriptionPubliqueService service;

    private DossierInscription dossier;

    @BeforeEach
    void setUp() {
        dossier = new DossierInscription();
        dossier.setNumeroDossier("DOSS-2026-0001");
        dossier.setMontantInscription(50.0);
        dossier.setDeviseInscription("USD");
        dossier.setFraisInscriptionPayes(false);
        dossier.setCreeLe(LocalDateTime.now().minusHours(1));
    }

    // ─── Initiation ──────────────────────────────────────────────────

    @Test
    void initier_ShouldCreatePendingTransaction_AndNeverMarkDossierPaid() {
        when(dossierRepo.findByNumeroDossier("DOSS-2026-0001")).thenReturn(Optional.of(dossier));
        when(mobileMoneyService.initierChargeOperateur(eq("VODACOM"), eq("+243900000000"),
                anyDouble(), anyString())).thenReturn("VOD_123");
        when(transactionDossierRepo.save(any(TransactionDossier.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = service.initierPaiementFraisInscription(
                "DOSS-2026-0001", "VODACOM", "+243900000000");

        assertThat(result.get("status")).isEqualTo("PENDING");
        assertThat(result.get("externalId")).isEqualTo("VOD_123");
        assertThat(result.get("reference").toString()).startsWith("DOSS-2026-0001-");
        // Invariant central : le dossier n'est PAS marqué payé à l'initiation.
        assertThat(dossier.getFraisInscriptionPayes()).isFalse();
        verify(dossierRepo, never()).save(any());
    }

    @Test
    void initier_ShouldThrow_WhenFraisDejaPayes() {
        dossier.setFraisInscriptionPayes(true);
        when(dossierRepo.findByNumeroDossier("DOSS-2026-0001")).thenReturn(Optional.of(dossier));

        assertThatThrownBy(() -> service.initierPaiementFraisInscription(
                "DOSS-2026-0001", "VODACOM", "+243900000000"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("déjà réglés");
    }

    @Test
    void initier_ShouldThrow_WhenLienExpire() {
        dossier.setCreeLe(LocalDateTime.now().minusHours(73));
        when(dossierRepo.findByNumeroDossier("DOSS-2026-0001")).thenReturn(Optional.of(dossier));

        assertThatThrownBy(() -> service.initierPaiementFraisInscription(
                "DOSS-2026-0001", "VODACOM", "+243900000000"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("expire");
    }

    @Test
    void initier_ShouldThrow_WhenMontantAbsent() {
        dossier.setMontantInscription(null);
        when(dossierRepo.findByNumeroDossier("DOSS-2026-0001")).thenReturn(Optional.of(dossier));

        assertThatThrownBy(() -> service.initierPaiementFraisInscription(
                "DOSS-2026-0001", "VODACOM", "+243900000000"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("montant");
    }

    @Test
    void initier_ShouldRecordFailedTransaction_WhenOperateurEchoue() {
        when(dossierRepo.findByNumeroDossier("DOSS-2026-0001")).thenReturn(Optional.of(dossier));
        when(mobileMoneyService.initierChargeOperateur(anyString(), anyString(), anyDouble(), anyString()))
                .thenThrow(new RuntimeException("API opérateur indisponible"));
        when(transactionDossierRepo.save(any(TransactionDossier.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> service.initierPaiementFraisInscription(
                "DOSS-2026-0001", "VODACOM", "+243900000000"))
                .isInstanceOf(RuntimeException.class);

        verify(transactionDossierRepo).save(any(TransactionDossier.class));
        assertThat(dossier.getFraisInscriptionPayes()).isFalse();
    }

    // ─── Confirmation par webhook ────────────────────────────────────

    private TransactionDossier txPending() {
        return TransactionDossier.builder()
                .numeroDossier("DOSS-2026-0001")
                .reference("DOSS-2026-0001-1")
                .provider("VODACOM")
                .externalId("VOD_123")
                .telephone("+243900000000")
                .montant(50.0)
                .devise("USD")
                .status("PENDING")
                .build();
    }

    @Test
    void confirmer_Success_ShouldMarkDossierPaid() {
        TransactionDossier tx = txPending();
        when(transactionDossierRepo.findByProviderAndExternalId("VODACOM", "VOD_123"))
                .thenReturn(Optional.of(tx));
        when(transactionDossierRepo.save(any(TransactionDossier.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(dossierRepo.findByNumeroDossier("DOSS-2026-0001")).thenReturn(Optional.of(dossier));
        when(dossierRepo.save(any(DossierInscription.class))).thenAnswer(inv -> inv.getArgument(0));

        service.confirmerPaiementFraisDossier("VODACOM", "VOD_123", "SUCCESS", "ok");

        assertThat(tx.getStatus()).isEqualTo("SUCCESS");
        assertThat(dossier.getFraisInscriptionPayes()).isTrue();
        assertThat(dossier.getReferencePaiement()).isEqualTo("DOSS-2026-0001-1");
        assertThat(dossier.getModePaiement()).isEqualTo("MOBILE_MONEY");
        assertThat(dossier.getNumeroTransaction()).isEqualTo("VOD_123");
        verify(dossierRepo).save(dossier);
    }

    @Test
    void confirmer_Failed_ShouldNotMarkDossierPaid() {
        TransactionDossier tx = txPending();
        when(transactionDossierRepo.findByProviderAndExternalId("VODACOM", "VOD_123"))
                .thenReturn(Optional.of(tx));
        when(transactionDossierRepo.save(any(TransactionDossier.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.confirmerPaiementFraisDossier("VODACOM", "VOD_123", "FAILED", "refusé");

        assertThat(tx.getStatus()).isEqualTo("FAILED");
        assertThat(dossier.getFraisInscriptionPayes()).isFalse();
        verify(dossierRepo, never()).save(any());
    }

    @Test
    void confirmer_ShouldBeIdempotent_WhenTransactionDejaTerminale() {
        TransactionDossier tx = txPending();
        tx.setStatus("SUCCESS");
        when(transactionDossierRepo.findByProviderAndExternalId("VODACOM", "VOD_123"))
                .thenReturn(Optional.of(tx));

        Map<String, Object> result = service.confirmerPaiementFraisDossier(
                "VODACOM", "VOD_123", "SUCCESS", "rejeu");

        assertThat(result.get("ignored")).isEqualTo(true);
        verify(transactionDossierRepo, never()).save(any());
        verify(dossierRepo, never()).save(any());
    }

    @Test
    void confirmer_ShouldThrow_WhenTransactionInconnue() {
        when(transactionDossierRepo.findByProviderAndExternalId("VODACOM", "INCONNU"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.confirmerPaiementFraisDossier(
                "VODACOM", "INCONNU", "SUCCESS", "x"))
                .isInstanceOf(RuntimeException.class);
    }

    // ─── Statut (polling frontend) ───────────────────────────────────

    @Test
    void statut_ShouldMapPendingToEnAttente() {
        TransactionDossier tx = txPending();
        when(transactionDossierRepo.findByReference("DOSS-2026-0001-1"))
                .thenReturn(Optional.of(tx));
        when(dossierRepo.findByNumeroDossier("DOSS-2026-0001")).thenReturn(Optional.of(dossier));

        Map<String, Object> result = service.getStatutPaiementDossier("DOSS-2026-0001-1");

        assertThat(result.get("statut")).isEqualTo("EN_ATTENTE");
        assertThat(result.get("paye")).isEqualTo(false);
    }

    @Test
    void statut_ShouldMapSuccessToValide() {
        TransactionDossier tx = txPending();
        tx.setStatus("SUCCESS");
        dossier.setFraisInscriptionPayes(true);
        when(transactionDossierRepo.findByReference("DOSS-2026-0001-1"))
                .thenReturn(Optional.of(tx));
        when(dossierRepo.findByNumeroDossier("DOSS-2026-0001")).thenReturn(Optional.of(dossier));

        Map<String, Object> result = service.getStatutPaiementDossier("DOSS-2026-0001-1");

        assertThat(result.get("statut")).isEqualTo("VALIDE");
        assertThat(result.get("paye")).isEqualTo(true);
    }
}
