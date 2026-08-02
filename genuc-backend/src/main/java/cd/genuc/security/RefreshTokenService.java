package cd.genuc.security;

import cd.genuc.exception.BusinessException;
import cd.genuc.model.RefreshToken;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Gestion des refresh tokens, avec rotation et stockage haché.
 *
 * <p>Trois faiblesses corrigées ici :</p>
 * <ol>
 *   <li><b>Pas de rotation</b> — le même refresh token restait valable pendant toute
 *       sa durée de vie (7 jours par défaut). Un jeton intercepté une fois donnait donc
 *       une semaine d'accès renouvelable, sans aucun signal.</li>
 *   <li><b>Stockage en clair</b> — la table {@code refresh_tokens} contenait la valeur
 *       exacte à présenter. Une lecture de la base (sauvegarde, injection SQL, accès
 *       d'exploitation) suffisait à usurper n'importe quelle session.</li>
 *   <li><b>Aucune détection de rejeu</b> — présenter un jeton déjà révoqué renvoyait
 *       une simple erreur, sans conséquence.</li>
 * </ol>
 *
 * <p>Désormais : à chaque rafraîchissement l'ancien jeton est révoqué et un nouveau est
 * émis ; seul le SHA-256 est stocké ; et présenter un jeton révoqué non expiré révoque
 * <b>toute</b> la famille de jetons de l'utilisateur — c'est la signature d'un vol, le
 * voleur et la victime se disputant la même chaîne.</p>
 *
 * <p><b>Note de déploiement</b> : les lignes existantes contiennent des jetons en clair
 * qui ne correspondront plus à un haché. Les sessions en cours devront donc se
 * reconnecter une fois, au premier rafraîchissement suivant la mise en production.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private static final SecureRandom ALEA = new SecureRandom();

    /**
     * Auto-injection via le proxy Spring : un appel interne {@code this.methode()}
     * court-circuiterait le proxy transactionnel, et {@code REQUIRES_NEW} serait
     * silencieusement ignoré. Même motif que {@code MobileMoneyService}.
     */
    @Autowired
    @Lazy
    private RefreshTokenService self;

    @Value("${genuc.refresh-token.expiration-days:7}")
    private int expirationDays;

    /**
     * Jeton fraîchement émis : la valeur en clair n'existe qu'ici et dans la réponse
     * HTTP — la base n'en garde que l'empreinte.
     *
     * @param valeur    à transmettre au client (unique occurrence en clair)
     * @param entite    ligne persistée correspondante
     */
    public record JetonEmis(String valeur, RefreshToken entite) {
    }

    @Transactional
    public JetonEmis emettre(Utilisateur utilisateur) {
        String valeur = genererValeur();
        RefreshToken token = RefreshToken.builder()
                .token(hacher(valeur))
                .utilisateur(utilisateur)
                .expireLe(Instant.now().plusSeconds(expirationDays * 86_400L))
                .build();
        return new JetonEmis(valeur, refreshTokenRepository.save(token));
    }

    /**
     * Vérifie un refresh token et le remplace par un nouveau (rotation).
     *
     * @return le jeton de remplacement, à renvoyer au client
     * @throws BusinessException si le jeton est inconnu, expiré, ou déjà utilisé
     */
    @Transactional
    public JetonEmis rafraichir(String valeurPresentee) {
        RefreshToken actuel = verifier(valeurPresentee);
        actuel.setRevoque(true);
        refreshTokenRepository.save(actuel);
        return emettre(actuel.getUtilisateur());
    }

    /**
     * Contrôle de validité sans rotation.
     *
     * <p>Un jeton trouvé mais révoqué signifie qu'il a déjà servi : soit l'utilisateur
     * légitime rejoue une ancienne réponse, soit un tiers utilise une copie volée. On
     * ne peut pas distinguer les deux, donc on coupe toute la chaîne — le compte devra
     * se reconnecter, ce qui est le comportement sûr.</p>
     */
    @Transactional
    public RefreshToken verifier(String valeurPresentee) {
        if (valeurPresentee == null || valeurPresentee.isBlank()) {
            throw new BusinessException("REFRESH_TOKEN_INVALIDE", "Refresh token invalide");
        }
        RefreshToken refreshToken = refreshTokenRepository.findByToken(hacher(valeurPresentee))
                .orElseThrow(() -> new BusinessException("REFRESH_TOKEN_INVALIDE", "Refresh token invalide"));

        if (refreshToken.isRevoque()) {
            log.warn("Réutilisation d'un refresh token révoqué (utilisateur {}) — "
                    + "révocation de toutes les sessions par précaution.",
                    refreshToken.getUtilisateur() != null ? refreshToken.getUtilisateur().getEmail() : "?");
            if (refreshToken.getUtilisateur() != null) {
                // Transaction SÉPARÉE, et via le proxy (self) : l'exception levée juste
                // après marque la transaction courante pour rollback, ce qui annulerait
                // la révocation si elle partageait la même transaction. Vérifié au
                // runtime : sans cela, le jeton de remplacement restait utilisable
                // après détection du rejeu.
                self.revoquerFamille(refreshToken.getUtilisateur());
            }
            throw new BusinessException("REFRESH_TOKEN_REVOQUE", "Refresh token révoqué");
        }
        if (refreshToken.estExpire()) {
            throw new BusinessException("REFRESH_TOKEN_EXPIRE", "Refresh token expiré");
        }
        return refreshToken;
    }

    @Transactional
    public void revoquer(String valeurPresentee) {
        if (valeurPresentee == null || valeurPresentee.isBlank()) {
            return;
        }
        refreshTokenRepository.findByToken(hacher(valeurPresentee)).ifPresent(rt -> {
            rt.setRevoque(true);
            refreshTokenRepository.save(rt);
        });
    }

    @Transactional
    public void revoquerTousParUtilisateur(Utilisateur utilisateur) {
        refreshTokenRepository.revoquerTousParUtilisateur(utilisateur);
    }

    /**
     * Révoque toute la famille de jetons d'un utilisateur dans une transaction
     * autonome, afin que la révocation survive au rollback provoqué par l'exception
     * de rejeu. À n'appeler que via {@link #self}.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void revoquerFamille(Utilisateur utilisateur) {
        refreshTokenRepository.revoquerTousParUtilisateur(utilisateur);
    }

    // Nettoyage nocturne des tokens expirés/révoqués
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgerTokensObsoletes() {
        int supprime = refreshTokenRepository.supprimerExpiresEtRevoques(Instant.now());
        if (supprime > 0) {
            log.info("Purge refresh tokens : {} supprimés", supprime);
        }
    }

    // ══════════════════════════════════════════
    // Interne
    // ══════════════════════════════════════════

    /** 256 bits d'aléa cryptographique, encodés sans caractère à échapper en URL/JSON. */
    private String genererValeur() {
        byte[] octets = new byte[32];
        ALEA.nextBytes(octets);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(octets);
    }

    /**
     * SHA-256 sans sel : le jeton est déjà un aléa de 256 bits, il n'est pas devinable
     * par dictionnaire — contrairement à un mot de passe, un sel n'apporterait rien et
     * empêcherait la recherche indexée par empreinte.
     */
    private String hacher(String valeur) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(valeur.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 est exigé par la spécification de la plateforme Java.
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }
}
