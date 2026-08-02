package cd.genuc.service.tachpay;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Arrays;
import java.util.List;

/**
 * Vérifie l'authenticité des webhooks des opérateurs mobile money.
 *
 * <p>Les endpoints {@code /api/tachpay/webhook/**} sont publics (permitAll) — ils
 * DOIVENT donc prouver qu'un appel provient bien de l'opérateur avant de valider
 * un paiement. Chaque opérateur signe le corps brut de la requête en HMAC-SHA256
 * avec un secret partagé et transmet la signature (hex) dans l'en-tête
 * {@code X-Webhook-Signature} (préfixe {@code sha256=} optionnel).</p>
 *
 * <p>Le secret est lu par opérateur ({@code genuc.webhook.<provider>.secret}) avec
 * repli sur un secret global ({@code genuc.webhook.secret}). Si aucun secret n'est
 * configuré et que {@code genuc.webhook.require-signature=true} (défaut, prod), la
 * requête est rejetée — jamais de validation silencieuse d'un paiement non signé.
 * En dev, {@code require-signature=false} permet de tester sans secret.</p>
 *
 * <p>Depuis l'ajout de la sécurité renforcée, une whitelist IP est également
 * vérifiée pour chaque opérateur ({@code genuc.webhook.ip-whitelist.<provider>}),
 * permettant de rejeter les webhooks provenant d'IP non autorisées.</p>
 */
@Service
@Slf4j
public class WebhookSecurityService {

    private static final String HMAC_ALGO = "HmacSHA256";

    private final String secretGlobal;
    private final Map<String, String> secretsParProvider;
    private final Map<String, String> ipWhitelistParProvider;
    private final boolean signatureObligatoire;
    private final boolean ipWhitelistActive;

    public WebhookSecurityService(
            @Value("${genuc.webhook.secret:}") String secretGlobal,
            @Value("${genuc.webhook.vodacom.secret:}") String secretVodacom,
            @Value("${genuc.webhook.airtel.secret:}") String secretAirtel,
            @Value("${genuc.webhook.orange.secret:}") String secretOrange,
            @Value("${genuc.webhook.afrimoney.secret:}") String secretAfriMoney,
            @Value("${genuc.webhook.require-signature:true}") boolean signatureObligatoire,
            @Value("${genuc.webhook.ip-whitelist.active:true}") boolean ipWhitelistActive,
            @Value("${genuc.webhook.ip-whitelist.vodacom:}") String whitelistVodacom,
            @Value("${genuc.webhook.ip-whitelist.airtel:}") String whitelistAirtel,
            @Value("${genuc.webhook.ip-whitelist.orange:}") String whitelistOrange,
            @Value("${genuc.webhook.ip-whitelist.afrimoney:}") String whitelistAfriMoney) {
        this.secretGlobal = secretGlobal;
        this.signatureObligatoire = signatureObligatoire;
        this.ipWhitelistActive = ipWhitelistActive;
        this.secretsParProvider = Map.of(
                "VODACOM", secretVodacom,
                "AIRTEL", secretAirtel,
                "ORANGE", secretOrange,
                "AFRIMONEY", secretAfriMoney);
        this.ipWhitelistParProvider = Map.of(
                "VODACOM", whitelistVodacom,
                "AIRTEL", whitelistAirtel,
                "ORANGE", whitelistOrange,
                "AFRIMONEY", whitelistAfriMoney);
    }

    @PostConstruct
    void logConfiguration() {
        if (!signatureObligatoire) {
            log.warn("⚠️  genuc.webhook.require-signature=false — les webhooks de paiement " +
                    "sans secret sont acceptés. NE JAMAIS utiliser cette configuration en production.");
        }
        if (!ipWhitelistActive) {
            log.warn("⚠️  genuc.webhook.ip-whitelist.active=false — la whitelist IP est désactivée. " +
                    "Recommandé en production pour une sécurité renforcée.");
        }
        logConfigurationDetails();
    }

    private void logConfigurationDetails() {
        secretsParProvider.forEach((provider, secret) -> {
            boolean configure = secret != null && !secret.isBlank();
            log.info("Webhook {} : secret {} configuré", provider, configure ? "✓" : "✗");
        });
        ipWhitelistParProvider.forEach((provider, whitelist) -> {
            boolean configure = whitelist != null && !whitelist.isBlank();
            if (configure) {
                List<String> ips = Arrays.asList(whitelist.split(","));
                log.info("Webhook {} : whitelist IP avec {} adresses", provider, ips.size());
            } else {
                log.info("Webhook {} : whitelist IP non configurée", provider);
            }
        });
    }

    /**
     * @return true si la requête est authentique et peut être traitée.
     */
    public boolean signatureValide(String provider, String corpsBrut, String signatureRecue) {
        String secret = secretPour(provider);

        if (secret == null || secret.isBlank()) {
            if (signatureObligatoire) {
                log.error("Webhook {} rejeté : aucun secret configuré (genuc.webhook.{}.secret).",
                        provider, provider.toLowerCase(Locale.ROOT));
                return false;
            }
            log.warn("Webhook {} accepté sans vérification (aucun secret + require-signature=false).", provider);
            return true;
        }

        if (signatureRecue == null || signatureRecue.isBlank()) {
            log.warn("Webhook {} rejeté : en-tête X-Webhook-Signature absent.", provider);
            return false;
        }

        String attendue = calculerHmac(secret, corpsBrut);
        String recue = signatureRecue.startsWith("sha256=")
                ? signatureRecue.substring("sha256=".length())
                : signatureRecue;

        boolean valide = comparaisonConstante(attendue, recue);
        if (!valide) {
            log.warn("Webhook {} rejeté : signature invalide.", provider);
        }
        return valide;
    }

    /**
     * Vérifie si l'adresse IP source est autorisée pour ce provider.
     * @param provider Opérateur (VODACOM, AIRTEL, ORANGE, AFRIMONEY)
     * @param ipAdresse Adresse IP source de la requête
     * @return true si l'IP est autorisée ou si la whitelist est désactivée
     */
    public boolean ipAutorisee(String provider, String ipAdresse) {
        if (!ipWhitelistActive) {
            return true; // Whitelist désactivée = accepter toutes les IP
        }

        if (ipAdresse == null || ipAdresse.isBlank()) {
            log.warn("Webhook {} : adresse IP source manquante", provider);
            return false;
        }

        String whitelist = ipWhitelistParProvider.get(provider == null ? "" : provider.toUpperCase(Locale.ROOT));
        
        // Si aucune whitelist configurée pour ce provider, on accepte (fallback)
        if (whitelist == null || whitelist.isBlank()) {
            log.debug("Webhook {} : aucune whitelist IP configurée, accepté par défaut", provider);
            return true;
        }

        // Normaliser l'IP (enlever le port si présent)
        String ipNormalisee = ipAdresse.split(":")[0].trim();
        
        // Vérifier si l'IP est dans la whitelist (séparée par des virgules)
        List<String> ipsAutorisees = Arrays.asList(whitelist.split(","));
        boolean autorise = ipsAutorisees.stream()
                .map(String::trim)
                .anyMatch(ip -> ip.equals(ipNormalisee));

        if (!autorise) {
            log.warn("Webhook {} rejeté : IP {} non autorisée (whitelist: {})", 
                    provider, ipNormalisee, whitelist);
        }

        return autorise;
    }

    /**
     * Validation complète : signature + IP
     * @return true si la requête est authentique (signature valide + IP autorisée)
     */
    public boolean requeteValide(String provider, String corpsBrut, String signatureRecue, String ipAdresse) {
        // Vérifier d'abord l'IP (plus rapide que le calcul HMAC)
        if (!ipAutorisee(provider, ipAdresse)) {
            return false;
        }
        
        // Ensuite vérifier la signature
        return signatureValide(provider, corpsBrut, signatureRecue);
    }

    private String secretPour(String provider) {
        String secret = secretsParProvider.get(provider == null ? "" : provider.toUpperCase(Locale.ROOT));
        if (secret != null && !secret.isBlank()) {
            return secret;
        }
        return secretGlobal;
    }

    private String calculerHmac(String secret, String corps) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGO));
            byte[] hash = mac.doFinal((corps == null ? "" : corps).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            log.error("Impossible de calculer le HMAC du webhook : {}", e.getMessage());
            return "";
        }
    }

    /** Comparaison à temps constant pour éviter les attaques temporelles. */
    private boolean comparaisonConstante(String a, String b) {
        if (a == null || b == null || a.isEmpty()) {
            return false;
        }
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8));
    }
}
