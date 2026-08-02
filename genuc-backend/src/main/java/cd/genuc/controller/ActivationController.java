package cd.genuc.controller;

import cd.genuc.model.Utilisateur;
import cd.genuc.repository.UtilisateurRepository;
import cd.genuc.service.EmailService;
import cd.genuc.util.PasswordValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/activation")
@RequiredArgsConstructor
public class ActivationController {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // ══════════════════════════════════════════
    // VÉRIFIER LA VALIDITÉ D'UN TOKEN
    // ══════════════════════════════════════════

    @GetMapping("/verifier")
    public ResponseEntity<?> verifierToken(@RequestParam String token) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Token manquant"));
        }

        Utilisateur utilisateur = utilisateurRepository.findByTokenActivation(token).orElse(null);

        if (utilisateur == null) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Token invalide"));
        }

        if (utilisateur.isCompteActive()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Compte déjà activé"));
        }

        if (utilisateur.getTokenExpiration() == null
                || utilisateur.getTokenExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Token expiré"));
        }

        return ResponseEntity.ok(Map.of("valide", true, "email", utilisateur.getEmail(), "nom",
                utilisateur.getPrenom() + " " + utilisateur.getNom()));
    }

    // ══════════════════════════════════════════
    // CRÉER LE MOT DE PASSE ET ACTIVER LE COMPTE
    // ══════════════════════════════════════════

    @PostMapping("/creer-mot-de-passe")
    public ResponseEntity<?> creerMotDePasse(@RequestBody Map<String, String> body) {
        try {
            if (!body.containsKey("token") || !body.containsKey("motDePasse") || !body.containsKey("confirmMotDePasse")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "token, motDePasse et confirmMotDePasse sont requis"));
            }
            
            String token = body.get("token");
            String motDePasse = body.get("motDePasse");
            String confirmMotDePasse = body.get("confirmMotDePasse");

            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Token manquant"));
            }

            if (motDePasse == null || confirmMotDePasse == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Tous les champs sont obligatoires"));
            }

            if (!motDePasse.equals(confirmMotDePasse)) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Les mots de passe ne correspondent pas"));
            }

            cd.genuc.util.PasswordValidator.ValidationResult validation =
                    cd.genuc.util.PasswordValidator.validate(motDePasse);
            if (!validation.estValide()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("erreur", String.join("; ", validation.getErreurs())));
            }

            Utilisateur utilisateur = utilisateurRepository.findByTokenActivation(token)
                    .orElseThrow(() -> new RuntimeException("Token invalide"));

            if (utilisateur.isCompteActive()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Compte déjà activé"));
            }

            if (utilisateur.getTokenExpiration() == null
                    || utilisateur.getTokenExpiration().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Token expiré"));
            }

            utilisateur.setMotDePasse(passwordEncoder.encode(motDePasse));
            utilisateur.setCompteActive(true);
            utilisateur.setTokenActivation(null);
            utilisateur.setTokenExpiration(null);
            utilisateur.setDateActivation(LocalDateTime.now());
            utilisateurRepository.save(utilisateur);

            emailService.envoyerEmailBienvenue(utilisateur);

            return ResponseEntity.ok(Map.of("message", "Compte activé avec succès ! Vous pouvez maintenant vous connecter.",
                    "email", utilisateur.getEmail()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // RENVOYER L'EMAIL D'ACTIVATION
    // ══════════════════════════════════════════

    @PostMapping("/renvoyer")
    public ResponseEntity<?> renvoyerEmail(@RequestBody Map<String, String> body) {
        if (!body.containsKey("email")) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "L'email est obligatoire"));
        }
        String email = body.get("email");

        // Réponse générique : on ne révèle pas si l'email existe ou non (anti-énumération)
        utilisateurRepository.findByEmail(email).ifPresent(utilisateur -> {
            if (!utilisateur.isCompteActive()) {
                String nouveauToken = UUID.randomUUID().toString();
                utilisateur.setTokenActivation(nouveauToken);
                utilisateur.setTokenExpiration(LocalDateTime.now().plusHours(48));
                utilisateurRepository.save(utilisateur);

                String matricule = utilisateur.getInscriptionId() != null
                        ? "GENUC-" + utilisateur.getInscriptionId()
                        : "";
                emailService.envoyerEmailActivation(utilisateur, nouveauToken, matricule);
            }
        });

        return ResponseEntity.ok(Map.of(
                "message", "Si cet email est enregistré et non activé, un lien d'activation a été envoyé."));
    }

    // ══════════════════════════════════════════
    // VÉRIFIER SI UN COMPTE EST ACTIVÉ
    // ══════════════════════════════════════════

    @GetMapping("/statut")
    public ResponseEntity<?> verifierStatutCompte(@RequestParam String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "L'email est obligatoire"));
        }

        // Réponse générique même si l'email n'existe pas (anti-énumération)
        return utilisateurRepository.findByEmail(email)
                .map(u -> ResponseEntity.ok(Map.of(
                        "compteActive", u.isCompteActive(),
                        "actif", u.isActif())))
                .orElseGet(() -> ResponseEntity.ok(Map.of(
                        "compteActive", false,
                        "actif", false)));
    }
}