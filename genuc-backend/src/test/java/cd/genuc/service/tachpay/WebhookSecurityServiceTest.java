package cd.genuc.service.tachpay;

import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;

class WebhookSecurityServiceTest {

    private static final String SECRET = "secret_vodacom_ultra_confidentiel";
    private static final String BODY = "{\"transactionId\":\"VOD_123\",\"status\":\"SUCCESS\"}";

    /**
     * Fabrique un service pour les tests de SIGNATURE : whitelist IP désactivée
     * (ces tests ne portent que sur le HMAC, pas sur l'IP source).
     */
    private WebhookSecurityService service(String global, String vodacom, String airtel,
                                           String orange, String afriMoney, boolean requireSignature) {
        return new WebhookSecurityService(
            global, vodacom, airtel, orange, afriMoney, requireSignature,
            false, "", "", "", "");
    }

    private String hmac(String secret, String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
    }

    /** Signature obligatoire + secret par opérateur : une signature HMAC correcte passe. */
    @Test
    void signatureValide_avecHmacCorrect_accepte() throws Exception {
        WebhookSecurityService service = service("", SECRET, "", "", "", true);

        assertThat(service.signatureValide("VODACOM", BODY, hmac(SECRET, BODY))).isTrue();
        assertThat(service.signatureValide("VODACOM", BODY, "sha256=" + hmac(SECRET, BODY))).isTrue();
    }

    /** Une signature falsifiée ou calculée avec un mauvais secret est rejetée. */
    @Test
    void signatureValide_avecMauvaiseSignature_rejette() throws Exception {
        WebhookSecurityService service = service("", SECRET, "", "", "", true);

        assertThat(service.signatureValide("VODACOM", BODY, "deadbeef")).isFalse();
        assertThat(service.signatureValide("VODACOM", BODY, hmac("mauvais_secret", BODY))).isFalse();
    }

    /** Le cœur de la faille corrigée : sans en-tête de signature, on refuse. */
    @Test
    void signatureValide_sansEntete_rejette() {
        WebhookSecurityService service = service("", SECRET, "", "", "", true);

        assertThat(service.signatureValide("VODACOM", BODY, null)).isFalse();
        assertThat(service.signatureValide("VODACOM", BODY, "")).isFalse();
    }

    /** require-signature=true + aucun secret configuré : fail-closed (refus). */
    @Test
    void signatureValide_secretManquantEtObligatoire_rejette() throws Exception {
        WebhookSecurityService service = service("", "", "", "", "", true);

        assertThat(service.signatureValide("VODACOM", BODY, hmac(SECRET, BODY))).isFalse();
    }

    /** Mode dev : require-signature=false + aucun secret → accepté (test local). */
    @Test
    void signatureValide_devSansSecret_accepte() {
        WebhookSecurityService service = service("", "", "", "", "", false);

        assertThat(service.signatureValide("VODACOM", BODY, null)).isTrue();
    }

    /** Le secret global sert de repli quand aucun secret spécifique n'est défini. */
    @Test
    void signatureValide_replliSurSecretGlobal() throws Exception {
        WebhookSecurityService service = service(SECRET, "", "", "", "", true);

        assertThat(service.signatureValide("AIRTEL", BODY, hmac(SECRET, BODY))).isTrue();
    }

    /** AfriMoney a son propre secret comme les autres opérateurs mobiles. */
    @Test
    void signatureValide_secretAfriMoney_accepte() throws Exception {
        WebhookSecurityService service = service("", "", "", "", SECRET, true);

        assertThat(service.signatureValide("AFRIMONEY", BODY, hmac(SECRET, BODY))).isTrue();
    }

    // ─── Whitelist IP (fonctionnalité récente, sans couverture jusqu'ici) ───

    /** Whitelist active : seule une IP listée passe, une IP inconnue est rejetée. */
    @Test
    void ipAutorisee_whitelistActive_filtreLesIp() {
        WebhookSecurityService service = new WebhookSecurityService(
            "", SECRET, "", "", "", false,
            true, "41.0.0.1, 41.0.0.2", "", "", "");

        assertThat(service.ipAutorisee("VODACOM", "41.0.0.1")).isTrue();   // listée
        assertThat(service.ipAutorisee("VODACOM", "41.0.0.9")).isFalse();  // non listée
    }

    /** Whitelist désactivée : toutes les IP sont acceptées (fallback). */
    @Test
    void ipAutorisee_whitelistDesactivee_accepteToutesLesIp() {
        WebhookSecurityService service = new WebhookSecurityService(
            "", SECRET, "", "", "", false,
            false, "41.0.0.1", "", "", "");

        assertThat(service.ipAutorisee("VODACOM", "9.9.9.9")).isTrue();
    }
}
