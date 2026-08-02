// src/test/java/cd/genuc/controller/AuthControllerTest.java
package cd.genuc.controller;

import cd.genuc.IntegrationTestBase;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.UtilisateurRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.TimeProvider;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest extends IntegrationTestBase {

    private static final String EMAIL_MFA = "mfa-test@genuc.cd";
    private static final String MDP_MFA = "MfaTest123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SecretGenerator secretGenerator;

    @Autowired
    private TimeProvider timeProvider;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TransactionTemplate transactionTemplate;

    /**
     * La connexion réussie émet un refresh token qui référence le compte : le
     * supprimer directement viole la clé étrangère de {@code refresh_tokens}.
     */
    @AfterEach
    void supprimerCompteMfa() {
        transactionTemplate.executeWithoutResult(statut -> {
            entityManager
                .createQuery("DELETE FROM RefreshToken r WHERE r.utilisateur.email = :email")
                .setParameter("email", EMAIL_MFA)
                .executeUpdate();
            entityManager
                .createQuery("DELETE FROM Utilisateur u WHERE u.email = :email")
                .setParameter("email", EMAIL_MFA)
                .executeUpdate();
        });
    }

    @Test
    void testLogin_ValidCredentials_ShouldSetCookiesAndOmitTokenFromBody() throws Exception {
        Map<String, String> loginRequest = Map.of(
            "email", "admin@genuc.cd",
            "motDePasse", "Genuc2024!"
        );

        MvcResult resultat = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").exists())
                // Les jetons voyagent en cookies HttpOnly depuis le passage aux
                // cookies de session : les exposer dans le corps les rendrait
                // lisibles en JavaScript.
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andReturn();

        assertThat(cookiesPosees(resultat)).anyMatch(c -> c.startsWith("genuc_token="));
    }

    @Test
    void testLogin_InvalidCredentials_ShouldReturnUnauthorized() throws Exception {
        Map<String, String> loginRequest = Map.of(
            "email", "wrong@genuc.cd",
            "motDePasse", "wrongpassword"
        );

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Régression : la deuxième étape 2FA renvoyait un jeton d'accès valide mais
     * ne posait aucun cookie, contrairement à /login. Un compte protégé par 2FA
     * franchissait la vérification du code sans jamais ouvrir de session.
     */
    @Test
    void testLoginVerify2fa_ShouldSetSessionCookies() throws Exception {
        String secret = creerCompteAvec2fa();

        // Étape 1 : le mot de passe seul ne donne qu'un défi, sans session.
        MvcResult premiereEtape = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("email", EMAIL_MFA, "motDePasse", MDP_MFA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaRequired").value(true))
                .andExpect(jsonPath("$.mfaChallengeToken").exists())
                .andReturn();

        assertThat(cookiesPosees(premiereEtape))
            .noneMatch(c -> c.startsWith("genuc_token="));

        String challenge = objectMapper
            .readTree(premiereEtape.getResponse().getContentAsString())
            .get("mfaChallengeToken").asText();

        // Étape 2 : le code TOTP valide ouvre la session.
        CodeGenerator generateur = new DefaultCodeGenerator();
        String code = generateur.generate(secret, timeProvider.getTime() / 30);

        MvcResult secondeEtape = mockMvc.perform(post("/api/auth/2fa/login-verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("mfaChallengeToken", challenge, "code", code))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL_MFA))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andReturn();

        List<String> cookies = cookiesPosees(secondeEtape);
        assertThat(cookies).anyMatch(c -> c.startsWith("genuc_token="));
        assertThat(cookies).anyMatch(c -> c.startsWith("genuc_refresh_token="));
    }

    @Test
    void testLoginVerify2fa_InvalidCode_ShouldReturnUnauthorized() throws Exception {
        creerCompteAvec2fa();

        MvcResult premiereEtape = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("email", EMAIL_MFA, "motDePasse", MDP_MFA))))
                .andExpect(status().isOk())
                .andReturn();

        String challenge = objectMapper
            .readTree(premiereEtape.getResponse().getContentAsString())
            .get("mfaChallengeToken").asText();

        mockMvc.perform(post("/api/auth/2fa/login-verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("mfaChallengeToken", challenge, "code", "000000"))))
                .andExpect(status().isUnauthorized());
    }

    /** Crée un compte dédié avec 2FA active et renvoie son secret TOTP. */
    private String creerCompteAvec2fa() {
        String secret = secretGenerator.generate();

        Utilisateur utilisateur = utilisateurRepository.findByEmail(EMAIL_MFA)
            .orElseGet(Utilisateur::new);
        utilisateur.setNom("Test");
        utilisateur.setPrenom("Mfa");
        utilisateur.setEmail(EMAIL_MFA);
        utilisateur.setMotDePasse(passwordEncoder.encode(MDP_MFA));
        utilisateur.setRole(RoleEnum.ETUDIANT);
        utilisateur.setActif(true);
        utilisateur.setCompteActive(true);
        utilisateur.setTwoFactorSecret(secret);
        utilisateur.setTwoFactorEnabled(true);
        utilisateurRepository.save(utilisateur);

        return secret;
    }

    /**
     * CookieTokenService écrit ses cookies via addHeader("Set-Cookie", ...) et
     * non addCookie(), donc MockHttpServletResponse#getCookie ne les voit pas.
     */
    private List<String> cookiesPosees(MvcResult resultat) {
        return resultat.getResponse().getHeaders("Set-Cookie");
    }
}
