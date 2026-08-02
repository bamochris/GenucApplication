package cd.genuc.controller;

import cd.genuc.model.Utilisateur;
import cd.genuc.repository.UtilisateurRepository;
import cd.genuc.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivationControllerTest {

    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;

    @InjectMocks
    private ActivationController activationController;

    private Utilisateur utilisateurInactif;
    private Utilisateur utilisateurActif;

    @BeforeEach
    void setUp() {
        utilisateurInactif = Utilisateur.builder()
            .id(1L)
            .nom("MWAMBA")
            .prenom("Alice")
            .email("alice.mwamba@unikin.cd")
            .motDePasse("old_hash")
            .role(cd.genuc.model.RoleEnum.ETUDIANT)
            .compteActive(false)
            .actif(true)
            .tokenActivation("valid-token-123")
            .tokenExpiration(LocalDateTime.now().plusHours(24))
            .build();

        utilisateurActif = Utilisateur.builder()
            .id(2L)
            .nom("TSHISEKEDI")
            .prenom("Bob")
            .email("bob@unikin.cd")
            .role(cd.genuc.model.RoleEnum.ETUDIANT)
            .motDePasse("hash")
            .compteActive(true)
            .actif(true)
            .tokenActivation("used-token-456")
            .build();
    }

    // ─── verifierToken ───────────────────────────────────────────

    @Test
    void verifier_ShouldReturn200_WhenTokenValidAndAccountNotActive() {
        when(utilisateurRepository.findByTokenActivation("valid-token-123"))
            .thenReturn(Optional.of(utilisateurInactif));

        ResponseEntity<?> response = activationController.verifierToken("valid-token-123");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isInstanceOf(Map.class);
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body).containsEntry("valide", true);
        assertThat(body.get("email")).isEqualTo("alice.mwamba@unikin.cd");
    }

    @Test
    void verifier_ShouldReturn400_WhenTokenUnknown() {
        when(utilisateurRepository.findByTokenActivation("bad-token"))
            .thenReturn(Optional.empty());

        ResponseEntity<?> response = activationController.verifierToken("bad-token");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void verifier_ShouldReturn400_WhenAccountAlreadyActive() {
        when(utilisateurRepository.findByTokenActivation("used-token-456"))
            .thenReturn(Optional.of(utilisateurActif));

        ResponseEntity<?> response = activationController.verifierToken("used-token-456");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body.get("erreur")).isEqualTo("Compte déjà activé");
    }

    @Test
    void verifier_ShouldReturn400_WhenTokenExpired() {
        utilisateurInactif.setTokenExpiration(LocalDateTime.now().minusHours(1));
        when(utilisateurRepository.findByTokenActivation("expired-token"))
            .thenReturn(Optional.of(utilisateurInactif));

        ResponseEntity<?> response = activationController.verifierToken("expired-token");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body.get("erreur")).isEqualTo("Token expiré");
    }

    // ─── creerMotDePasse ─────────────────────────────────────────

    @Test
    void creerMotDePasse_ShouldActivateAccount_WhenValidInput() {
        when(utilisateurRepository.findByTokenActivation("valid-token-123"))
            .thenReturn(Optional.of(utilisateurInactif));
        when(passwordEncoder.encode("Password1!")).thenReturn("hashed!");
        when(utilisateurRepository.save(any(Utilisateur.class))).thenReturn(utilisateurInactif);
        doNothing().when(emailService).envoyerEmailBienvenue(any(Utilisateur.class));

        Map<String, String> body = Map.of(
            "token", "valid-token-123",
            "motDePasse", "Password1!",
            "confirmMotDePasse", "Password1!"
        );

        ResponseEntity<?> response = activationController.creerMotDePasse(body);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(utilisateurRepository).save(any(Utilisateur.class));
        verify(emailService).envoyerEmailBienvenue(utilisateurInactif);
        assertThat(utilisateurInactif.isCompteActive()).isTrue();
    }

    @Test
    void creerMotDePasse_ShouldReturn400_WhenPasswordsDoNotMatch() {
        Map<String, String> body = Map.of(
            "token", "valid-token-123",
            "motDePasse", "Password1!",
            "confirmMotDePasse", "Different!"
        );

        ResponseEntity<?> response = activationController.creerMotDePasse(body);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        @SuppressWarnings("unchecked")
        Map<String, Object> respBody = (Map<String, Object>) response.getBody();
        assertThat(respBody.get("erreur")).isEqualTo("Les mots de passe ne correspondent pas");
        verify(utilisateurRepository, never()).save(any());
    }

    @Test
    void creerMotDePasse_ShouldReturn400_WhenPasswordTooShort() {
        Map<String, String> body = Map.of(
            "token", "t", "motDePasse", "short", "confirmMotDePasse", "short"
        );

        ResponseEntity<?> response = activationController.creerMotDePasse(body);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void creerMotDePasse_ShouldReturn400_WhenMissingFields() {
        Map<String, String> body = Map.of("token", "t");

        ResponseEntity<?> response = activationController.creerMotDePasse(body);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    // ─── renvoyerEmail ───────────────────────────────────────────

    @Test
    void renvoyer_ShouldSendEmail_WhenAccountExistsAndNotActivated() {
        when(utilisateurRepository.findByEmail("alice.mwamba@unikin.cd"))
            .thenReturn(Optional.of(utilisateurInactif));
        when(utilisateurRepository.save(any())).thenReturn(utilisateurInactif);
        doNothing().when(emailService).envoyerEmailActivation(any(), anyString(), anyString());

        ResponseEntity<?> response = activationController.renvoyerEmail(
            Map.of("email", "alice.mwamba@unikin.cd")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(emailService).envoyerEmailActivation(eq(utilisateurInactif), anyString(), anyString());
    }

    @Test
    void renvoyer_ShouldReturnSameResponse_WhenEmailNotFound() {
        when(utilisateurRepository.findByEmail("ghost@unikin.cd"))
            .thenReturn(Optional.empty());

        ResponseEntity<?> response = activationController.renvoyerEmail(
            Map.of("email", "ghost@unikin.cd")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(emailService, never()).envoyerEmailActivation(any(), any(), any());
    }

    @Test
    void renvoyer_ShouldNotSendEmail_WhenAccountAlreadyActivated() {
        when(utilisateurRepository.findByEmail("bob@unikin.cd"))
            .thenReturn(Optional.of(utilisateurActif));

        ResponseEntity<?> response = activationController.renvoyerEmail(
            Map.of("email", "bob@unikin.cd")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(emailService, never()).envoyerEmailActivation(any(), any(), any());
    }

    // ─── verifierStatutCompte ─────────────────────────────────────

    @Test
    void statut_ShouldReturnCompteActiveTrue_WhenAccountActive() {
        when(utilisateurRepository.findByEmail("bob@unikin.cd"))
            .thenReturn(Optional.of(utilisateurActif));

        ResponseEntity<?> response = activationController.verifierStatutCompte("bob@unikin.cd");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body.get("compteActive")).isEqualTo(true);
    }

    @Test
    void statut_ShouldReturnFalse_WhenEmailNotFound() {
        when(utilisateurRepository.findByEmail("unknown@unikin.cd"))
            .thenReturn(Optional.empty());

        ResponseEntity<?> response = activationController.verifierStatutCompte("unknown@unikin.cd");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body.get("compteActive")).isEqualTo(false);
        assertThat(body.get("actif")).isEqualTo(false);
    }
}
