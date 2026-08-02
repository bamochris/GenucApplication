package cd.genuc.controller;

import cd.genuc.config.CookieTokenService;
import cd.genuc.config.GenucProperties;
import cd.genuc.exception.BusinessException;
import cd.genuc.exception.InvalidCredentialsException;
import cd.genuc.exception.UtilisateurNotFoundException;
import cd.genuc.model.RefreshToken;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.UtilisateurRepository;
import cd.genuc.security.JwtService;
import cd.genuc.security.RefreshTokenService;
import cd.genuc.service.AuditService;
import cd.genuc.service.AuthService;
import cd.genuc.service.TwoFactorService;
import cd.genuc.dto.LoginRequest;
import cd.genuc.dto.InscriptionCompteRequest;
import cd.genuc.dto.TwoFactorRequest;
import cd.genuc.dto.PasswordChangeRequest;
import cd.genuc.dto.PasswordResetRequest;
import cd.genuc.dto.AddEmailRequest;
import cd.genuc.util.PasswordValidator;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final GenucProperties genucProperties;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final TwoFactorService twoFactorService;
    private final CookieTokenService cookieTokenService;

    // ─── Endpoints existants ─────────────────────────────────────

    // Le rôle du compte créé vient du corps de la requête : l'endpoint doit rester réservé
    // au SUPER_ADMIN. Doublon volontaire de la règle d'URL de SecurityConfig — si un
    // permitAll trop large réapparaissait sur /api/auth/**, cette annotation continuerait
    // de bloquer (l'inverse n'est pas vrai : un permitAll n'annule pas un @PreAuthorize).
    @PostMapping("/inscrire")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> inscrire(@Valid @RequestBody InscriptionCompteRequest requete) {
        // @Valid gère la validation d'entrée (champs requis, format email, tailles).
        // Ce bloc ne traite plus que les erreurs MÉTIER (rôle invalide, email déjà
        // pris, universiteId/departementId requis selon le rôle) → clé "erreur"
        // conservée pour le frontend (AuthContext lit data.erreur en priorité).
        try {
            RoleEnum role;
            try {
                role = RoleEnum.valueOf(requete.getRole());
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Rôle invalide : " + requete.getRole()));
            }
            Map<String, Object> reponse = authService.inscrire(
                    requete.getNom(), requete.getPrenom(), requete.getEmail(), requete.getMotDePasse(),
                    requete.getTelephone(), role, requete.getUniversiteId(), requete.getDepartementId());
            auditService.logAction("CREATE", "Utilisateur", (Long) reponse.get("id"),
                    null, null, (Long) reponse.get("id"), requete.getEmail(), true, null, "AUTH", null);
            return ResponseEntity.status(HttpStatus.CREATED).body(reponse);
        } catch (RuntimeException e) {
            auditService.logAction("CREATE_FAILED", "Utilisateur", null,
                    null, null, null, requete.getEmail(), false, e.getMessage(), "AUTH", null);
            log.warn("Échec inscription : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", "Échec de l'inscription"));
        }
    }

    @PostMapping({"/connecter", "/login"})
    public ResponseEntity<?> connecter(@Valid @RequestBody LoginRequest body, HttpServletResponse response) {
        String email = body.getEmail();
        String motDePasse = body.getMotDePasse();
        long start = System.currentTimeMillis();

        try {
            log.info("Tentative de connexion pour : {}", email);

            Map<String, Object> reponse = authService.connecter(email, motDePasse);
            long duration = System.currentTimeMillis() - start;

            auditService.logConnexion(email, true, null);
            auditService.logAction("LOGIN_SUCCESS", "Connexion", null,
                    null, null, (Long) reponse.get("id"), email,
                    true, null, "AUTH", duration);

            // Définir les cookies HttpOnly
            String token = (String) reponse.get("token");
            String refreshToken = (String) reponse.get("refreshToken");
            if (token != null) {
                cookieTokenService.setAccessTokenCookie(response, token);
            }
            if (refreshToken != null) {
                cookieTokenService.setRefreshTokenCookie(response, refreshToken);
            }

            // Retirer les tokens du corps de la réponse (plus exposés dans le JSON)
            reponse.remove("token");
            reponse.remove("refreshToken");

            return ResponseEntity.ok(reponse);

        } catch (InvalidCredentialsException e) {
            auditerEchec(email, e, start);
            String message = e.isExposable() ? e.getMessage() : "Email ou mot de passe incorrect";
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erreur", message, "code", "INVALID_CREDENTIALS"));

        } catch (BusinessException e) {
            auditerEchec(email, e, start);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erreur", e.getMessage(), "code", e.getCode()));

        } catch (Exception e) {
            log.error("Erreur inattendue lors de la connexion pour {}", email, e);
            auditerEchec(email, e, start);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Erreur interne du serveur. Réessayez plus tard.",
                                 "code", "INTERNAL_ERROR"));
        }
    }

    /** Journalise (audit + log) un échec de connexion, quel qu'en soit le motif. */
    private void auditerEchec(String email, Exception e, long start) {
        long duration = System.currentTimeMillis() - start;
        log.warn("Échec de connexion pour : {} ({})", email, e.getMessage());
        auditService.logConnexion(email, false, e.getMessage());
        auditService.logAction("LOGIN_FAILED", "Connexion", null,
                null, null, null, email,
                false, e.getMessage(), "AUTH", duration);
    }

    // ─── 2FA — deuxième étape de connexion ────────────

    @PostMapping("/2fa/login-verify")
    public ResponseEntity<?> verifierMfaEtConnecter(@RequestBody TwoFactorRequest body,
                                                    HttpServletResponse response) {
        String mfaChallengeToken = body.getMfaChallengeToken();
        String code = body.getCode();
        try {
            Map<String, Object> reponse = authService.verifierMfaEtConnecter(mfaChallengeToken, code);

            // Même contrat que /connecter : les jetons partent en cookies HttpOnly
            // et jamais dans le corps. Sans ces deux lignes, la deuxième étape
            // renvoyait bien un jeton mais n'ouvrait aucune session — un compte
            // protégé par 2FA ne pouvait pas se connecter.
            String token = (String) reponse.get("token");
            String refreshToken = (String) reponse.get("refreshToken");
            if (token != null) {
                cookieTokenService.setAccessTokenCookie(response, token);
            }
            if (refreshToken != null) {
                cookieTokenService.setRefreshTokenCookie(response, refreshToken);
            }
            reponse.remove("token");
            reponse.remove("refreshToken");

            auditService.logAction("LOGIN_2FA_SUCCESS", "Connexion", null,
                    null, null, (Long) reponse.get("id"), (String) reponse.get("email"), true, null, "AUTH", null);
            return ResponseEntity.ok(reponse);
        } catch (Exception e) {
            auditService.logAction("LOGIN_2FA_FAILED", "Connexion", null,
                    null, null, null, null, false, e.getMessage(), "AUTH", null);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erreur", "Code de vérification invalide ou expiré"));
        }
    }

    // ─── 2FA — gestion (compte authentifié) ───────────

    @PostMapping("/2fa/setup")
    public ResponseEntity<?> demarrerActivation2fa(@AuthenticationPrincipal Utilisateur utilisateur,
                                                         @RequestBody TwoFactorRequest body) {
        if (utilisateur == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            return ResponseEntity.ok(twoFactorService.demarrerActivation(utilisateur.getId()));
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/2fa/confirm")
    public ResponseEntity<?> confirmerActivation2fa(@AuthenticationPrincipal Utilisateur utilisateur,
                                                     @RequestBody TwoFactorRequest body) {
        if (utilisateur == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            twoFactorService.confirmerActivation(utilisateur.getId(), body.getCode());
            auditService.logAction("2FA_ENABLED", "Utilisateur", utilisateur.getId(),
                    null, null, utilisateur.getId(), utilisateur.getEmail(), true, null, "AUTH", null);
            return ResponseEntity.ok(Map.of("message", "2FA activée avec succès"));
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/2fa/disable")
    public ResponseEntity<?> desactiver2fa(@AuthenticationPrincipal Utilisateur utilisateur,
                                            @RequestBody TwoFactorRequest body) {
        if (utilisateur == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            twoFactorService.desactiver(utilisateur.getId(), body.getCode());
            auditService.logAction("2FA_DISABLED", "Utilisateur", utilisateur.getId(),
                    null, null, utilisateur.getId(), utilisateur.getEmail(), true, null, "AUTH", null);
            return ResponseEntity.ok(Map.of("message", "2FA désactivée"));
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/2fa/status")
    public ResponseEntity<?> statut2fa(@AuthenticationPrincipal Utilisateur utilisateur) {
        if (utilisateur == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(Map.of("enabled", utilisateur.isTwoFactorEnabled()));
    }

    // ─── Diagnostiquer un compte ──────────────────────

    @GetMapping("/diagnostiquer/{email}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> diagnostiquerCompte(@PathVariable String email) {
        try {
            Utilisateur user = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new UtilisateurNotFoundException(email));

            Map<String, Object> result = new HashMap<>();
            result.put("email", user.getEmail());
            result.put("role", user.getRole());
            result.put("actif", user.isActif());
            result.put("compteActive", user.isCompteActive());
            // Le hash n'est jamais exposé via HTTP, même pour SUPER_ADMIN
            boolean estBCrypt = user.getMotDePasse() != null && user.getMotDePasse().startsWith("$2a$");
            result.put("estBCrypt", estBCrypt);
            result.put("motDePasseDefini", user.getMotDePasse() != null && !user.getMotDePasse().isBlank());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── Réinitialiser un compte avec le bon encodeur ──

    @PostMapping("/reinitialiser/{email}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> reinitialiserMotDePasse(
            @PathVariable String email,
            @RequestBody(required = false) PasswordResetRequest body) {
        try {
             String newPassword = (body != null && body.getMotDePasse() != null && !body.getMotDePasse().isBlank())
                    ? body.getMotDePasse()
                    : "Admin123!";

            PasswordValidator.ValidationResult validation =
                    PasswordValidator.validate(newPassword);
            if (!validation.estValide()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("erreur", String.join("; ", validation.getErreurs())));
            }

            Utilisateur user = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new UtilisateurNotFoundException(email));

            String encoded = passwordEncoder.encode(newPassword);
            user.setMotDePasse(encoded);
            user.setCompteActive(true);
            user.setActif(true);
            utilisateurRepository.save(user);

            log.info("Mot de passe réinitialisé pour : {}", email);
            auditService.logAction("PASSWORD_RESET", "Utilisateur", user.getId(),
                    null, "Mot de passe réinitialisé via endpoint", user.getId(),
                    email, true, null, "AUTH", null);

            return ResponseEntity.ok(Map.of(
                    "message", "Mot de passe réinitialisé avec succès",
                    "email", email
            ));
        } catch (BusinessException e) {
            log.error("Erreur lors de la réinitialisation de {}", email);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── Réinitialiser TOUS les comptes de test ────────

    @Transactional
    @PostMapping("/reinitialiser-tous")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> reinitialiserTousLesComptes() {
        try {
            Map<String, String> testAccounts = genucProperties.getTestAccounts();
            if (testAccounts == null || testAccounts.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucun compte de test configuré"));
            }
            int misAJour = 0;
            for (Map.Entry<String, String> entry : testAccounts.entrySet()) {
                String email = entry.getKey();
                String plainPassword = entry.getValue();
                utilisateurRepository.findByEmail(email).ifPresent(user -> {
                    user.setMotDePasse(passwordEncoder.encode(plainPassword));
                    user.setCompteActive(true);
                    user.setActif(true);
                    utilisateurRepository.save(user);
                    log.info("Compte réinitialisé : {}", email);
                });
                misAJour++;
            }

            auditService.logAction("BULK_PASSWORD_RESET", "Système", null,
                    null, "Réinitialisation de tous les comptes de test", null,
                    null, true, null, "AUTH", null);

            return ResponseEntity.ok(Map.of(
                    "message", "Tous les comptes de test ont été réinitialisés",
                    "comptesMisAJour", misAJour
            ));
        } catch (Exception e) {
            log.error("Erreur lors de la réinitialisation en masse", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Erreur interne lors de la réinitialisation"));
        }
    }

    // ─── Refresh token ───────────────────────────────

    @PostMapping("/refresh")
    public ResponseEntity<?> rafraichirToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenStr = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("genuc_refresh_token".equals(cookie.getName())) {
                    refreshTokenStr = cookie.getValue();
                    break;
                }
            }
        }
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "refreshToken est requis"));
        }
        try {
            // Rotation : l'ancien refresh token est révoqué et remplacé. Un jeton
            // intercepté ne vaut donc plus que jusqu'au prochain rafraîchissement
            // légitime — après quoi son rejeu déclenche la révocation de la session.
            var nouveau = refreshTokenService.rafraichir(refreshTokenStr);
            Utilisateur utilisateur = nouveau.entite().getUtilisateur();
            String newAccessToken = jwtService.genererToken(utilisateur);

            // Définir les cookies HttpOnly
            cookieTokenService.setAccessTokenCookie(response, newAccessToken);
            cookieTokenService.setRefreshTokenCookie(response, nouveau.valeur());

            return ResponseEntity.ok(Map.of(
                "type", "Bearer"
            ));
        } catch (Exception e) {
            log.warn("Refresh token invalide : {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("erreur", "Session expirée"));
        }
    }

    // ─── Changement de mot de passe (utilisateur connecté) ──────

    // Mot de passe oublié : matricule + email de contact. Réponse toujours
    // identique (aucune fuite sur l'existence du matricule ou du compte).
    @PostMapping("/mot-de-passe-oublie")
    public ResponseEntity<?> motDePasseOublie(@RequestBody PasswordResetRequest body) {
        try {
            authService.motDePasseOublieParMatricule(body.getMatricule(), body.getEmail());
        } catch (BusinessException e) {
            log.error("mot-de-passe-oublie : {}", e.getMessage());
        }
        return ResponseEntity.ok(Map.of("message",
            "Si ce matricule correspond à un compte, un mot de passe temporaire a été envoyé à l'adresse email associée."));
    }

    // L'utilisateur connecté ajoute/remplace son email de communication
    @PostMapping("/ajouter-email")
    public ResponseEntity<?> ajouterEmail(@org.springframework.security.core.annotation.AuthenticationPrincipal Utilisateur principal,
                                          @RequestBody AddEmailRequest body) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("erreur", "Non authentifié"));
        try {
            authService.mettreAJourEmail(principal, body.getEmail());
            return ResponseEntity.ok(Map.of("message", "Adresse email enregistrée. Vous pouvez maintenant l'utiliser pour vous connecter."));
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // Photo de profil / photo passeport de l'utilisateur connecté
    @PostMapping("/photo")
    public ResponseEntity<?> televerserPhoto(@org.springframework.security.core.annotation.AuthenticationPrincipal Utilisateur principal,
                                             @RequestParam(defaultValue = "profil") String type,
                                             @org.springframework.web.bind.annotation.RequestPart("fichier") org.springframework.web.multipart.MultipartFile fichier) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("erreur", "Non authentifié"));
        try {
            return ResponseEntity.ok(authService.enregistrerPhoto(principal, type, fichier));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/mes-photos")
    public ResponseEntity<?> mesPhotos(@org.springframework.security.core.annotation.AuthenticationPrincipal Utilisateur principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("erreur", "Non authentifié"));
        return ResponseEntity.ok(authService.mesPhotos(principal));
    }

    @PostMapping("/changer-mot-de-passe")
    public ResponseEntity<?> changerMotDePasse(@AuthenticationPrincipal Utilisateur principal,
                                               @RequestBody PasswordChangeRequest body) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("erreur", "Non authentifié"));

        String ancien  = body.getAncienMotDePasse();
        String nouveau = body.getNouveauMotDePasse();
        if (ancien == null || nouveau == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "erreur", "Les champs ancienMotDePasse et nouveauMotDePasse sont requis."));
        }

        PasswordValidator.ValidationResult validation =
                PasswordValidator.validate(nouveau);
        if (!validation.estValide()) {
            return ResponseEntity.badRequest().body(Map.of(
                "erreur", String.join("; ", validation.getErreurs())));
        }

        // Recharger l'entité (le principal peut être détaché de la session Hibernate)
        Utilisateur utilisateur = utilisateurRepository.findById(principal.getId())
                .orElseThrow(() -> new UtilisateurNotFoundException(principal.getId()));

        if (!passwordEncoder.matches(ancien, utilisateur.getMotDePasse())) {
            auditService.logAction("PASSWORD_CHANGE_FAILED", "Utilisateur", utilisateur.getId(),
                    null, null, utilisateur.getId(), utilisateur.getEmail(), false,
                    "Mot de passe actuel incorrect", "AUTH", null);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Mot de passe actuel incorrect."));
        }

        utilisateur.setMotDePasse(passwordEncoder.encode(nouveau));
        utilisateurRepository.save(utilisateur);

        // Révoque toutes les sessions persistantes : un mot de passe changé doit
        // invalider les refresh tokens existants (poste volé, session oubliée...)
        refreshTokenService.revoquerTousParUtilisateur(utilisateur);

        auditService.logAction("PASSWORD_CHANGED", "Utilisateur", utilisateur.getId(),
                null, null, utilisateur.getId(), utilisateur.getEmail(), true, null, "AUTH", null);
        return ResponseEntity.ok(Map.of(
            "message", "Mot de passe modifié. Vos autres sessions ont été déconnectées."));
    }

    // ─── Vérification du mot de passe (actions sensibles) ───────
    // Reconfirme le mot de passe de l'utilisateur connecté sans émettre de
    // nouveaux tokens ; sert de verrou avant une action irréversible
    // (modification/suppression d'université, etc.).
    @PostMapping("/verifier-mot-de-passe")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> verifierMotDePasse(@AuthenticationPrincipal Utilisateur principal,
                                                 @RequestBody PasswordChangeRequest body) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("erreur", "Non authentifié"));

        String motDePasse = body.getAncienMotDePasse();
        if (motDePasse == null || motDePasse.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Mot de passe requis"));
        }

        Utilisateur utilisateur = utilisateurRepository.findById(principal.getId())
                .orElseThrow(() -> new UtilisateurNotFoundException(principal.getId()));

        boolean valide = passwordEncoder.matches(motDePasse, utilisateur.getMotDePasse());
        auditService.logAction(valide ? "PASSWORD_CONFIRM" : "PASSWORD_CONFIRM_FAILED", "Utilisateur",
                utilisateur.getId(), null, null, utilisateur.getId(), utilisateur.getEmail(),
                valide, valide ? null : "Mot de passe incorrect", "AUTH", null);

        if (!valide) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("erreur", "Mot de passe incorrect."));
        }
        return ResponseEntity.ok(Map.of("valide", true));
    }

    // ─── Logout ──────────────────────────────────────

    @PostMapping("/logout")
    public ResponseEntity<?> deconnecter(HttpServletResponse response) {
        cookieTokenService.clearAccessTokenCookie(response);
        cookieTokenService.clearRefreshTokenCookie(response);
        return ResponseEntity.ok(Map.of("message", "Déconnexion réussie"));
    }

    // ─── Profil ─────────────────────────────────────

    @GetMapping("/moi")
    public ResponseEntity<?> monProfil(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("erreur", "Non authentifié"));
        }
        return ResponseEntity.ok(Map.of("email", userDetails.getUsername(), "roles", userDetails.getAuthorities()));
    }

}