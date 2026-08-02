package cd.genuc.service;

import cd.genuc.model.Utilisateur;
import cd.genuc.repository.UtilisateurRepository;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Authentification à deux facteurs (TOTP) — activation en libre-service, mais visée en
 * priorité pour les rôles sensibles (recteur, superadmin) via l'UI "Sécurité du compte".
 * Une fois activée, {@link AuthService#connecter} exige un second facteur avant de délivrer
 * un jeton d'accès complet (voir {@code JwtService.genererTokenDefiMfa}).
 */
@Service
@RequiredArgsConstructor
public class TwoFactorService {

    private static final String ISSUER = "GENUC";

    private final UtilisateurRepository utilisateurRepo;
    private final SecretGenerator secretGenerator;
    private final QrGenerator qrGenerator;
    private final CodeVerifier codeVerifier;

    /**
     * Démarre l'activation : génère un nouveau secret (pas encore actif tant que
     * {@link #confirmerActivation} n'a pas validé un code).
     */
    @Transactional
    public Map<String, Object> demarrerActivation(Long userId) {
        Utilisateur utilisateur = trouverUtilisateur(userId);

        String secret = secretGenerator.generate();
        utilisateur.setTwoFactorSecret(secret);
        utilisateur.setTwoFactorEnabled(false);
        utilisateurRepo.save(utilisateur);

        QrData data = new QrData.Builder()
                .label(utilisateur.getEmail())
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("secret", secret);
        resultat.put("otpAuthUrl", data.getUri());
        try {
            byte[] qrPng = qrGenerator.generate(data);
            resultat.put("qrCodeImage", "data:image/png;base64," + Base64.getEncoder().encodeToString(qrPng));
        } catch (QrGenerationException e) {
            throw new RuntimeException("Erreur lors de la génération du QR code 2FA", e);
        }
        return resultat;
    }

    @Transactional
    public void confirmerActivation(Long userId, String code) {
        Utilisateur utilisateur = trouverUtilisateur(userId);
        if (utilisateur.getTwoFactorSecret() == null) {
            throw new RuntimeException("Aucune activation 2FA en cours — appelez d'abord /2fa/setup");
        }
        if (!codeVerifier.isValidCode(utilisateur.getTwoFactorSecret(), code)) {
            throw new RuntimeException("Code de vérification invalide");
        }
        utilisateur.setTwoFactorEnabled(true);
        utilisateurRepo.save(utilisateur);
    }

    @Transactional
    public void desactiver(Long userId, String code) {
        Utilisateur utilisateur = trouverUtilisateur(userId);
        if (!utilisateur.isTwoFactorEnabled() || utilisateur.getTwoFactorSecret() == null) {
            throw new RuntimeException("La 2FA n'est pas activée sur ce compte");
        }
        if (!codeVerifier.isValidCode(utilisateur.getTwoFactorSecret(), code)) {
            throw new RuntimeException("Code de vérification invalide");
        }
        utilisateur.setTwoFactorEnabled(false);
        utilisateur.setTwoFactorSecret(null);
        utilisateurRepo.save(utilisateur);
    }

    public boolean verifierCode(Utilisateur utilisateur, String code) {
        return utilisateur.getTwoFactorSecret() != null
                && code != null
                && codeVerifier.isValidCode(utilisateur.getTwoFactorSecret(), code);
    }

    private Utilisateur trouverUtilisateur(Long userId) {
        return utilisateurRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : id=" + userId));
    }
}
