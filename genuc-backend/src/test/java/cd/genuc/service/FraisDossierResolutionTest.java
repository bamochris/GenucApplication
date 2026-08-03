package cd.genuc.service;

import cd.genuc.model.DossierInscription;
import cd.genuc.model.ParametresUniversite;
import cd.genuc.model.Universite;
import cd.genuc.repository.ParametresUniversiteRepository;
import cd.genuc.repository.VacationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Résolution des frais de dossier.
 *
 * <p>Ces tests décrivent un défaut constaté en production : l'écran « Paramètres
 * de l'établissement » enregistre le montant dans {@code ParametresUniversite},
 * alors que le dépôt lisait {@code Universite} — deux champs homonymes portés par
 * deux entités distinctes. Le montant saisi par l'administrateur restait donc sans
 * effet, et le dossier partait avec un montant nul, sans que rien ne le signale.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FraisDossierResolutionTest {

    @Mock private ParametresUniversiteRepository parametresRepo;
    @Mock private VacationRepository vacationRepo;

    @InjectMocks private InscriptionPubliqueService service;

    @Test
    void utiliseLesFraisDesParametres_ceuxQueLAdministrateurSaisitReellement() {
        Universite uni = universite(null);
        when(parametresRepo.findByUniversiteId(1L)).thenReturn(Optional.of(parametres(75.0)));

        DossierInscription dossier = new DossierInscription();
        service.appliquerVacationEtFrais(dossier, uni, null);

        assertThat(dossier.getMontantInscription()).isEqualTo(75.0);
    }

    @Test
    void retombeSurLUniversite_pourLesFichesAnterieuresAuModuleDeParametrage() {
        Universite uni = universite(40.0);
        when(parametresRepo.findByUniversiteId(1L)).thenReturn(Optional.empty());

        DossierInscription dossier = new DossierInscription();
        service.appliquerVacationEtFrais(dossier, uni, null);

        assertThat(dossier.getMontantInscription()).isEqualTo(40.0);
    }

    @Test
    void lesParametresPriment_quandLesDeuxSontRenseignes() {
        Universite uni = universite(40.0);
        when(parametresRepo.findByUniversiteId(1L)).thenReturn(Optional.of(parametres(75.0)));

        DossierInscription dossier = new DossierInscription();
        service.appliquerVacationEtFrais(dossier, uni, null);

        // C'est l'écran de paramétrage qui fait foi : c'est celui que
        // l'administrateur utilise, et donc celui qu'il croit modifier.
        assertThat(dossier.getMontantInscription()).isEqualTo(75.0);
    }

    @Test
    void zeroEstUnMontantValide_etNonUneAbsence() {
        Universite uni = universite(null);
        when(parametresRepo.findByUniversiteId(1L)).thenReturn(Optional.of(parametres(0.0)));

        DossierInscription dossier = new DossierInscription();
        service.appliquerVacationEtFrais(dossier, uni, null);

        // Un établissement qui n'exige rien saisit 0 : le dépôt doit passer,
        // pas être refusé comme s'il manquait un paramétrage.
        assertThat(dossier.getMontantInscription()).isEqualTo(0.0);
    }

    @Test
    void refuseLeDepot_quandAucunMontantNEstDefini() {
        Universite uni = universite(null);
        when(parametresRepo.findByUniversiteId(1L)).thenReturn(Optional.empty());

        DossierInscription dossier = new DossierInscription();

        // Sans ce refus, le dossier traversait tout le parcours avec un montant
        // nul et n'échouait qu'au paiement — là où le candidat ne peut rien faire.
        assertThatThrownBy(() -> service.appliquerVacationEtFrais(dossier, uni, null))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("frais de dossier ne sont pas définis");
    }

    // ── fabriques ────────────────────────────────────────────────

    private Universite universite(Double fraisInscription) {
        Universite u = new Universite();
        u.setId(1L);
        u.setDevise("USD");
        u.setFraisInscription(fraisInscription);
        return u;
    }

    private ParametresUniversite parametres(Double frais) {
        ParametresUniversite p = new ParametresUniversite();
        p.setFraisInscription(frais);
        return p;
    }
}
