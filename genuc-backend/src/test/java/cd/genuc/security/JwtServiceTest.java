package cd.genuc.security;

import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;
    private Utilisateur utilisateur;

    private static final String VALID_SECRET = "genuc_test_secret_key_minimum_32_chars_ok";
    private static final long EXPIRATION_MS = 3_600_000L; // 1 hour

    @BeforeEach
    void setUp() throws Exception {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", VALID_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", EXPIRATION_MS);
        jwtService.initialiser();

        utilisateur = Utilisateur.builder()
            .id(1L)
            .nom("MULAMBA")
            .prenom("Sophie")
            .email("sophie.mulamba@unikin.cd")
            .motDePasse("encoded")
            .role(RoleEnum.ETUDIANT)
            .universiteId(10L)
            .departementId(5L)
            .compteActive(true)
            .actif(true)
            .build();
    }

    // ─── initialiser ─────────────────────────────────────────────

    @Test
    void initialiser_ShouldThrow_WhenSecretTooShort() {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "jwtSecret", "tooshort");
        ReflectionTestUtils.setField(service, "jwtExpiration", EXPIRATION_MS);

        assertThatThrownBy(service::initialiser)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("32 octets");
    }

    @Test
    void initialiser_ShouldThrow_WhenSecretBlank() {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "jwtSecret", "   ");
        ReflectionTestUtils.setField(service, "jwtExpiration", EXPIRATION_MS);

        assertThatThrownBy(service::initialiser)
            .isInstanceOf(IllegalStateException.class);
    }

    // ─── genererToken ────────────────────────────────────────────

    @Test
    void genererToken_ShouldReturnNonNullToken() {
        String token = jwtService.genererToken(utilisateur);

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    void genererToken_ShouldEmbedEmailAsSubject() {
        String token = jwtService.genererToken(utilisateur);

        assertThat(jwtService.extraireEmail(token)).isEqualTo("sophie.mulamba@unikin.cd");
    }

    @Test
    void genererToken_ShouldEmbedRole() {
        String token = jwtService.genererToken(utilisateur);

        assertThat(jwtService.extraireRole(token)).isEqualTo("ETUDIANT");
    }

    @Test
    void genererToken_ShouldEmbedUniversiteId() {
        String token = jwtService.genererToken(utilisateur);

        assertThat(jwtService.extraireUniversiteId(token)).isEqualTo(10L);
    }

    @Test
    void genererToken_ShouldEmbedCompteActive() {
        String token = jwtService.genererToken(utilisateur);

        assertThat(jwtService.estCompteActive(token)).isTrue();
    }

    // ─── estValide ───────────────────────────────────────────────

    @Test
    void estValide_ShouldReturnTrue_ForValidTokenAndMatchingUser() {
        String token = jwtService.genererToken(utilisateur);
        UserDetails userDetails = User.withUsername("sophie.mulamba@unikin.cd")
            .password("x").authorities(Collections.emptyList()).build();

        assertThat(jwtService.estValide(token, userDetails)).isTrue();
    }

    @Test
    void estValide_ShouldReturnFalse_WhenUsernameDoesNotMatch() {
        String token = jwtService.genererToken(utilisateur);
        UserDetails otherUser = User.withUsername("other@unikin.cd")
            .password("x").authorities(Collections.emptyList()).build();

        assertThat(jwtService.estValide(token, otherUser)).isFalse();
    }

    @Test
    void estValide_ShouldReturnFalse_ForExpiredToken() throws Exception {
        JwtService shortLivedService = new JwtService();
        ReflectionTestUtils.setField(shortLivedService, "jwtSecret", VALID_SECRET);
        ReflectionTestUtils.setField(shortLivedService, "jwtExpiration", 1L); // 1 ms
        shortLivedService.initialiser();

        String token = shortLivedService.genererToken(utilisateur);
        Thread.sleep(10);

        UserDetails userDetails = User.withUsername("sophie.mulamba@unikin.cd")
            .password("x").authorities(Collections.emptyList()).build();

        assertThat(shortLivedService.estValide(token, userDetails)).isFalse();
    }

    @Test
    void estValide_ShouldReturnFalse_ForTamperedToken() {
        String token = jwtService.genererToken(utilisateur) + "tampered";
        UserDetails userDetails = User.withUsername("sophie.mulamba@unikin.cd")
            .password("x").authorities(Collections.emptyList()).build();

        assertThat(jwtService.estValide(token, userDetails)).isFalse();
    }

    // ─── extraireExpiration ──────────────────────────────────────

    @Test
    void extraireExpiration_ShouldBeInFuture() {
        String token = jwtService.genererToken(utilisateur);

        Date expiration = jwtService.extraireExpiration(token);
        assertThat(expiration).isAfter(new Date());
    }

    // ─── extraireAuthorites ──────────────────────────────────────

    @Test
    void extraireAuthorites_ShouldReturnRoleWithPrefix() {
        String token = jwtService.genererToken(utilisateur);

        var authorities = jwtService.extraireAuthorites(token);
        assertThat(authorities).hasSize(1);
        assertThat(authorities.get(0).getAuthority()).isEqualTo("ROLE_ETUDIANT");
    }

    // ─── null universiteId ───────────────────────────────────────

    @Test
    void genererToken_ShouldHandleNullUniversiteId() {
        utilisateur.setUniversiteId(null);
        String token = jwtService.genererToken(utilisateur);

        assertThat(jwtService.extraireUniversiteId(token)).isNull();
    }
}
