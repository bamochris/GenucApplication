package cd.genuc.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Le mode pilote existe pour exploiter la plateforme académique avant d'avoir
 * contractualisé avec les opérateurs mobile money. Ce qu'il ne doit JAMAIS faire :
 * laisser passer un encaissement traité par le simulateur, qui serait enregistré
 * comme un vrai paiement. Ces tests figent la frontière.
 */
class ModePiloteFilterTest {

    private static final String CORPS_REFUS = "PAIEMENT_INDISPONIBLE";

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/payments/mobile/initiate",
            "/api/payments/callback/vodacom",
            "/api/v1/payments/checkout",
            "/api/tachpay/session",
            "/api/tachfee/session",
            "/api/dossiers/HADOS-2026-123456/payer"
    })
    void modePiloteActif_RefuseLesEncaissementsExternes(String chemin) throws Exception {
        MockHttpServletResponse reponse = executer(true, "POST", chemin);

        assertThat(reponse.getStatus()).isEqualTo(503);
        assertThat(reponse.getContentAsString()).contains(CORPS_REFUS);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            // Saisie en caisse : espèces, virement, dépôt bancaire. Aucun
            // prestataire externe — un établissement doit pouvoir encaisser au
            // guichet pendant le pilote.
            "/api/paiements",
            "/api/paiements/gestion/valider",
            "/api/caisse/operations",
            // Le reste du parcours dossier doit rester ouvert : seul /payer ferme.
            "/api/dossiers",
            "/api/dossiers/statut/HADOS-2026-123456",
            "/api/dossiers/paiement/statut/HADOS-2026-123456-1738000000"
    })
    void modePiloteActif_LaissePasserLeResteDuMetier(String chemin) throws Exception {
        FilterChain chaine = mock(FilterChain.class);
        MockHttpServletResponse reponse = executer(true, "POST", chemin, chaine);

        assertThat(reponse.getStatus()).isEqualTo(200);
        verify(chaine).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void modePiloteInactif_NeBloqueRien() throws Exception {
        FilterChain chaine = mock(FilterChain.class);
        MockHttpServletResponse reponse = executer(false, "POST", "/api/payments/mobile/initiate", chaine);

        assertThat(reponse.getStatus()).isEqualTo(200);
        verify(chaine).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void preflightCors_PasseMemeSurUneRouteFermee() throws Exception {
        // Un 503 sur le préflight ferait remonter au navigateur une erreur CORS
        // opaque, au lieu du refus explicite que le front sait présenter.
        FilterChain chaine = mock(FilterChain.class);
        MockHttpServletResponse reponse = executer(true, "OPTIONS", "/api/payments/mobile/initiate", chaine);

        assertThat(reponse.getStatus()).isEqualTo(200);
        verify(chaine).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void cheminContenantPayerSansEnEtreLaFin_ResteOuvert() throws Exception {
        // Garde-fou sur la règle de fermeture : elle vise le suffixe /payer,
        // pas toute occurrence du mot.
        FilterChain chaine = mock(FilterChain.class);
        MockHttpServletResponse reponse = executer(true, "GET", "/api/dossiers/payer-plus-tard/statut", chaine);

        assertThat(reponse.getStatus()).isEqualTo(200);
        verify(chaine, never()).doFilter(null, null);
        verify(chaine).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    // ── utilitaires ──────────────────────────────────────────────

    private MockHttpServletResponse executer(boolean modePilote, String methode, String chemin)
            throws Exception {
        return executer(modePilote, methode, chemin, mock(FilterChain.class));
    }

    private MockHttpServletResponse executer(boolean modePilote, String methode, String chemin,
                                             FilterChain chaine) throws Exception {
        ModePiloteFilter filtre = new ModePiloteFilter(modePilote);
        MockHttpServletRequest requete = new MockHttpServletRequest(methode, chemin);
        requete.setRequestURI(chemin);
        MockHttpServletResponse reponse = new MockHttpServletResponse();
        // doFilter() applique shouldNotFilter(), contrairement à doFilterInternal().
        filtre.doFilter(requete, reponse, chaine);
        return reponse;
    }
}
