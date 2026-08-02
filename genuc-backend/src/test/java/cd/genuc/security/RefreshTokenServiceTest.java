package cd.genuc.security;

import cd.genuc.exception.BusinessException;
import cd.genuc.model.RefreshToken;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Rotation, hachage et détection de rejeu des refresh tokens.
 */
@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock private RefreshTokenRepository refreshTokenRepository;
    /** Proxy Spring simulé : c'est par lui que passe la révocation en transaction autonome. */
    @Mock private RefreshTokenService self;

    private RefreshTokenService service;
    private Utilisateur utilisateur;

    @BeforeEach
    void setUp() {
        service = new RefreshTokenService(refreshTokenRepository);
        ReflectionTestUtils.setField(service, "expirationDays", 7);
        ReflectionTestUtils.setField(service, "self", self);

        utilisateur = Utilisateur.builder()
                .id(1L).nom("TEST").prenom("Compte")
                .email("test@genuc.cd").motDePasse("x")
                .role(RoleEnum.ETUDIANT)
                .build();
    }

    // ─── Hachage ─────────────────────────────────────────────────

    @Test
    void emettre_NeStockeJamaisLaValeurEnClair() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        var emis = service.emettre(utilisateur);

        assertThat(emis.valeur()).isNotBlank();
        // Ce qui part en base est l'empreinte, jamais la valeur remise au client.
        assertThat(emis.entite().getToken())
                .isNotEqualTo(emis.valeur())
                .isEqualTo(sha256(emis.valeur()));
    }

    @Test
    void emettre_ProduitUneValeurDifferenteAChaqueAppel() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.emettre(utilisateur).valeur())
                .isNotEqualTo(service.emettre(utilisateur).valeur());
    }

    // ─── Vérification ────────────────────────────────────────────

    @Test
    void verifier_RechercheParEmpreinteEtNonParValeur() {
        RefreshToken stocke = jeton(sha256("valeur-en-clair"), false, Instant.now().plusSeconds(3600));
        when(refreshTokenRepository.findByToken(sha256("valeur-en-clair"))).thenReturn(Optional.of(stocke));

        assertThat(service.verifier("valeur-en-clair")).isSameAs(stocke);
    }

    @Test
    void verifier_RefuseUnJetonInconnu() {
        when(refreshTokenRepository.findByToken(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verifier("inconnu"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("invalide");
    }

    @Test
    void verifier_RefuseUnJetonExpire() {
        RefreshToken expire = jeton(sha256("v"), false, Instant.now().minusSeconds(60));
        when(refreshTokenRepository.findByToken(sha256("v"))).thenReturn(Optional.of(expire));

        assertThatThrownBy(() -> service.verifier("v"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("expiré");
    }

    @Test
    void verifier_RefuseUneValeurVide() {
        assertThatThrownBy(() -> service.verifier("  "))
                .isInstanceOf(BusinessException.class);
        verify(refreshTokenRepository, never()).findByToken(any());
    }

    // ─── Détection de rejeu ──────────────────────────────────────

    /**
     * Régression constatée au runtime : la révocation de la famille était exécutée
     * dans la transaction courante, que l'exception levée juste après faisait
     * annuler — le jeton de remplacement restait donc utilisable après un rejeu.
     * Elle doit passer par le proxy ({@code self}), en transaction autonome.
     */
    @Test
    void verifier_SurRejeu_RevoqueTouteLaFamilleViaUneTransactionAutonome() {
        RefreshToken revoque = jeton(sha256("vole"), true, Instant.now().plusSeconds(3600));
        when(refreshTokenRepository.findByToken(sha256("vole"))).thenReturn(Optional.of(revoque));

        assertThatThrownBy(() -> service.verifier("vole"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("révoqué");

        verify(self).revoquerFamille(utilisateur);
        // Surtout PAS d'appel direct au repository : il partagerait la transaction
        // marquée pour rollback.
        verify(refreshTokenRepository, never()).revoquerTousParUtilisateur(any());
    }

    // ─── Rotation ────────────────────────────────────────────────

    @Test
    void rafraichir_RevoqueLAncienEtEnEmetUnNouveau() {
        RefreshToken actuel = jeton(sha256("ancien"), false, Instant.now().plusSeconds(3600));
        when(refreshTokenRepository.findByToken(sha256("ancien"))).thenReturn(Optional.of(actuel));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        var nouveau = service.rafraichir("ancien");

        assertThat(actuel.isRevoque()).isTrue();
        assertThat(nouveau.valeur()).isNotEqualTo("ancien");
        assertThat(nouveau.entite().getToken()).isEqualTo(sha256(nouveau.valeur()));
    }

    // ══════════════════════════════════════════
    // Utilitaires
    // ══════════════════════════════════════════

    private RefreshToken jeton(String empreinte, boolean revoque, Instant expiration) {
        return RefreshToken.builder()
                .id(1L)
                .token(empreinte)
                .utilisateur(utilisateur)
                .expireLe(expiration)
                .revoque(revoque)
                .build();
    }

    private String sha256(String valeur) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(valeur.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
