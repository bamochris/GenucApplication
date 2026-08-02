package cd.genuc.service.tachpay;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class TachPayProductionReadinessCheck {

    private final Environment environment;

    @PostConstruct
    void verifierConfigurationProduction() {
        if (!profilProductionActif()) {
            return;
        }

        List<String> erreurs = new ArrayList<>();

        // Mode pilote : l'établissement exploite la plateforme académique avant
        // d'avoir signé avec les opérateurs mobile money. Les identifiants ne sont
        // donc pas exigés — mais les encaissements externes ne sont pas pour autant
        // « tolérés » : ModePiloteFilter refuse franchement les endpoints concernés
        // (503), de sorte qu'aucun paiement ne peut être ni simulé ni accepté.
        //
        // Les deux garde-fous qui comptent restent vérifiés : aucune simulation
        // activée, et signature de webhook toujours exigée. Ils empêchent qu'un
        // « pilote » serve de porte dérobée à un encaissement fictif.
        if (modePiloteActif()) {
            exigerFalse("genuc.payment.mobile-money.simulation-enabled", erreurs);
            exigerFalse("genuc.payment.card.simulation-enabled", erreurs);
            exigerTrue("genuc.webhook.require-signature", erreurs);
            exigerTrue("stripe.webhook.require-signature", erreurs);
            if (!erreurs.isEmpty()) {
                throw new IllegalStateException("Mode pilote mal configure : "
                    + String.join(" ; ", erreurs));
            }
            log.warn("╔══════════════════════════════════════════════════════════════════╗");
            log.warn("║  MODE PILOTE ACTIF — genuc.payment.mode-pilote=true              ║");
            log.warn("║  Les paiements mobile money et carte sont REFUSES (HTTP 503).    ║");
            log.warn("║  Aucun encaissement externe n'est possible. Les paiements en     ║");
            log.warn("║  especes et par virement saisis en caisse restent operationnels. ║");
            log.warn("║  Repasser a false des que les operateurs sont contractualises.   ║");
            log.warn("╚══════════════════════════════════════════════════════════════════╝");
            return;
        }

        exigerFalse("genuc.payment.mobile-money.simulation-enabled", erreurs);
        exigerFalse("genuc.payment.card.simulation-enabled", erreurs);
        exigerTrue("genuc.webhook.require-signature", erreurs);
        exigerTrue("stripe.webhook.require-signature", erreurs);
        exiger("genuc.webhook.public-base-url", erreurs);

        exiger("genuc.webhook.vodacom.secret", erreurs);
        exiger("genuc.webhook.airtel.secret", erreurs);
        exiger("genuc.webhook.orange.secret", erreurs);
        exiger("genuc.webhook.afrimoney.secret", erreurs);

        exiger("vodacom.mpesa.api.url", erreurs);
        exigerUnDes(List.of("vodacom.mpesa.api.key", "vodacom.mpesa.consumer.key"), "identifiant API Vodacom", erreurs);
        exigerUnDes(List.of("vodacom.mpesa.api.secret", "vodacom.mpesa.consumer.secret"), "secret API Vodacom", erreurs);
        exiger("vodacom.mpesa.shortcode", erreurs);

        exiger("airtel.money.api.url", erreurs);
        exigerUnDes(List.of("airtel.money.api.key", "airtel.money.client.id"), "identifiant API Airtel", erreurs);
        exigerUnDes(List.of("airtel.money.api.secret", "airtel.money.client.secret"), "secret API Airtel", erreurs);
        exiger("airtel.money.merchant.code", erreurs);

        exiger("orange.money.api.url", erreurs);
        exigerUnDes(List.of("orange.money.api.key", "orange.money.client.id"), "identifiant API Orange", erreurs);
        exigerUnDes(List.of("orange.money.api.secret", "orange.money.client.secret"), "secret API Orange", erreurs);
        exiger("orange.money.merchant.code", erreurs);

        exiger("afrimoney.api.url", erreurs);
        exigerUnDes(List.of("afrimoney.api.key", "afrimoney.client.id"), "identifiant API AfriMoney", erreurs);
        exigerUnDes(List.of("afrimoney.api.secret", "afrimoney.client.secret"), "secret API AfriMoney", erreurs);
        exiger("afrimoney.merchant.code", erreurs);

        exiger("stripe.api.key", erreurs);
        exiger("stripe.webhook-secret", erreurs);

        if (!erreurs.isEmpty()) {
            throw new IllegalStateException("Configuration TachPay production incomplete : "
                + String.join(" ; ", erreurs));
        }

        log.info("Configuration TachPay production validee : simulations desactivees, secrets et fournisseurs renseignes.");
    }

    private boolean profilProductionActif() {
        return Arrays.stream(environment.getActiveProfiles())
            .anyMatch(profile -> "prod".equalsIgnoreCase(profile));
    }

    private boolean modePiloteActif() {
        return environment.getProperty("genuc.payment.mode-pilote", Boolean.class, Boolean.FALSE);
    }

    private void exiger(String key, List<String> erreurs) {
        if (estNonConfigure(valeur(key))) {
            erreurs.add(key + " manquant");
        }
    }

    private void exigerUnDes(List<String> keys, String libelle, List<String> erreurs) {
        boolean configure = keys.stream().map(this::valeur).anyMatch(value -> !estNonConfigure(value));
        if (!configure) {
            erreurs.add(libelle + " manquant (" + String.join(" ou ", keys) + ")");
        }
    }

    private void exigerFalse(String key, List<String> erreurs) {
        if (Boolean.parseBoolean(valeur(key))) {
            erreurs.add(key + " doit etre false en production");
        }
    }

    private void exigerTrue(String key, List<String> erreurs) {
        if (!Boolean.parseBoolean(valeur(key))) {
            erreurs.add(key + " doit etre true en production");
        }
    }

    private String valeur(String key) {
        return environment.getProperty(key, "");
    }

    private boolean estNonConfigure(String value) {
        if (value == null || value.isBlank()) {
            return true;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.startsWith("${")
            || normalized.startsWith("dummy")
            || normalized.equals("default")
            || normalized.startsWith("your-");
    }
}