package cd.genuc.service;

import cd.genuc.exception.BusinessException;
import cd.genuc.exception.EmailAlreadyExistsException;
import cd.genuc.exception.InvalidCredentialsException;
import cd.genuc.model.RefreshToken;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.UtilisateurRepository;
import cd.genuc.security.JwtService;
import cd.genuc.security.LoginAttemptService;
import cd.genuc.security.RefreshTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private LoginAttemptService loginAttemptService;
    @Mock private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthService authService;

    private Utilisateur utilisateur;

    @BeforeEach
    void setUp() {
        utilisateur = Utilisateur.builder()
            .id(1L)
            .nom("KABILA")
            .prenom("Jean")
            .email("jean.kabila@unikin.cd")
            .motDePasse("hashedPassword")
            .role(RoleEnum.ETUDIANT)
            .compteActive(true)
            .actif(true)
            .build();
    }

    // ─── inscrire ────────────────────────────────────────────────

    @Test
    void inscrire_ShouldReturnTokenMap_WhenValidData() {
        when(utilisateurRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(utilisateurRepository.save(any(Utilisateur.class))).thenReturn(utilisateur);
        when(jwtService.genererToken(any(Utilisateur.class))).thenReturn("jwt.token.here");

        Map<String, Object> result = authService.inscrire(
            "KABILA", "Jean", "jean.kabila@unikin.cd", "Password1!",
            "+243810000001", RoleEnum.ETUDIANT, null, null
        );

        assertThat(result).containsKey("token");
        assertThat(result.get("token")).isEqualTo("jwt.token.here");
        assertThat(result.get("role")).isEqualTo(RoleEnum.ETUDIANT);
        verify(utilisateurRepository).save(any(Utilisateur.class));
    }

    @Test
    void inscrire_ShouldThrowEmailAlreadyExistsException_WhenEmailTaken() {
        when(utilisateurRepository.existsByEmail("jean.kabila@unikin.cd")).thenReturn(true);

        assertThatThrownBy(() -> authService.inscrire(
            "KABILA", "Jean", "jean.kabila@unikin.cd", "Password1!",
            "+243810000001", RoleEnum.ETUDIANT, null, null
        ))
            .isInstanceOf(EmailAlreadyExistsException.class)
            .hasMessageContaining("jean.kabila@unikin.cd");
    }

    @Test
    void inscrire_ShouldThrowBusinessException_WhenUniversiteIdMissingForAdminRole() {
        when(utilisateurRepository.existsByEmail(anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.inscrire(
            "DUPONT", "Marc", "marc@unikin.cd", "Password1!",
            "+243810000002", RoleEnum.ADMIN_UNIVERSITE, null, null
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("universiteId");
    }

    @Test
    void inscrire_ShouldThrowBusinessException_WhenDepartementIdMissingForEnseignant() {
        when(utilisateurRepository.existsByEmail(anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.inscrire(
            "PROF", "Alain", "alain@unikin.cd", "Password1!",
            "+243810000003", RoleEnum.ENSEIGNANT, 1L, null
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("departementId");
    }

    // ─── connecter ───────────────────────────────────────────────

    @Test
    void connecter_ShouldReturnTokenMap_WhenValidCredentials() {
        RefreshToken mockRefreshToken = RefreshToken.builder()
            .token("hache-du-refresh-token")
            .utilisateur(utilisateur)
            .expireLe(Instant.now().plusSeconds(604800))
            .build();

        when(loginAttemptService.estVerrouille(anyString())).thenReturn(false);
        when(utilisateurRepository.findByEmail(anyString())).thenReturn(Optional.of(utilisateur));
        when(jwtService.genererToken(any(Utilisateur.class))).thenReturn("valid.jwt.token");
        when(utilisateurRepository.save(any(Utilisateur.class))).thenReturn(utilisateur);
        when(refreshTokenService.emettre(any(Utilisateur.class)))
            .thenReturn(new RefreshTokenService.JetonEmis("refresh.token.value", mockRefreshToken));

        Map<String, Object> result = authService.connecter("jean.kabila@unikin.cd", "Password1!");

        assertThat(result).containsKey("token");
        assertThat(result.get("token")).isEqualTo("valid.jwt.token");
        assertThat(result.get("refreshToken")).isEqualTo("refresh.token.value");
        verify(loginAttemptService).loginReussi("jean.kabila@unikin.cd");
    }

    @Test
    void connecter_ShouldThrowInvalidCredentialsException_WhenAccountLocked() {
        when(loginAttemptService.estVerrouille("jean.kabila@unikin.cd")).thenReturn(true);

        assertThatThrownBy(() -> authService.connecter("jean.kabila@unikin.cd", "wrong"))
            .isInstanceOf(InvalidCredentialsException.class);

        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void connecter_ShouldThrowInvalidCredentialsException_WhenBadPassword() {
        when(loginAttemptService.estVerrouille(anyString())).thenReturn(false);
        doThrow(new BadCredentialsException("bad credentials"))
            .when(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThatThrownBy(() -> authService.connecter("jean.kabila@unikin.cd", "wrongpassword"))
            .isInstanceOf(InvalidCredentialsException.class);

        verify(loginAttemptService).loginEchoue("jean.kabila@unikin.cd");
        verify(loginAttemptService, never()).loginReussi(anyString());
    }

    @Test
    void connecter_ShouldThrowBusinessException_WhenAccountNotActivated() {
        utilisateur.setCompteActive(false);
        when(loginAttemptService.estVerrouille(anyString())).thenReturn(false);
        when(utilisateurRepository.findByEmail(anyString())).thenReturn(Optional.of(utilisateur));

        assertThatThrownBy(() -> authService.connecter("jean.kabila@unikin.cd", "Password1!"))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Compte non activé");
    }

    @Test
    void connecter_ShouldNormalizeEmailToLowercase() {
        RefreshToken mockRefreshToken = RefreshToken.builder()
            .token("hache-rt")
            .utilisateur(utilisateur)
            .expireLe(Instant.now().plusSeconds(604800))
            .build();

        when(loginAttemptService.estVerrouille("jean.kabila@unikin.cd")).thenReturn(false);
        when(utilisateurRepository.findByEmail("jean.kabila@unikin.cd")).thenReturn(Optional.of(utilisateur));
        when(jwtService.genererToken(any())).thenReturn("token");
        when(utilisateurRepository.save(any())).thenReturn(utilisateur);
        when(refreshTokenService.emettre(any()))
            .thenReturn(new RefreshTokenService.JetonEmis("rt", mockRefreshToken));

        authService.connecter("JEAN.KABILA@UNIKIN.CD", "Password1!");

        verify(loginAttemptService).estVerrouille("jean.kabila@unikin.cd");
        verify(utilisateurRepository).findByEmail("jean.kabila@unikin.cd");
    }
}
