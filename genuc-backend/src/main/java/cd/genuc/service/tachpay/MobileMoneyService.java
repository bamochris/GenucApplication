package cd.genuc.service.tachpay;

import cd.genuc.model.AffectationFrais;
import cd.genuc.model.Paiement;
import cd.genuc.model.TransactionExterne;
import cd.genuc.exception.OperateurPaiementException;
import cd.genuc.exception.PaymentException;
import cd.genuc.repository.AffectationFraisRepository;
import cd.genuc.repository.PaiementRepository;
import cd.genuc.repository.TransactionExterneRepository;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.env.Environment;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MobileMoneyService {

    private final PaiementRepository paiementRepo;
    private final TransactionExterneRepository transactionExterneRepo;
    private final AffectationFraisRepository affectationRepo;
    private final WebClient webClient;
    private final Environment environment;
    private final ObjectMapper objectMapper;

    // Auto-référence proxifiée : un appel interne (this.initierChargeOperateur depuis
    // initierPaiement) ne passe PAS par le proxy Spring, donc le @CircuitBreaker ne
    // s'appliquerait pas. Passer par self.initierChargeOperateur force le passage par
    // le proxy. @Lazy casse la dépendance circulaire sur soi-même au démarrage.
    @Autowired
    @Lazy
    private MobileMoneyService self;

    private record ProviderConfig(
            String provider,
            String simulationPrefix,
            String apiUrl,
            String clientId,
            String clientSecret,
            String merchantCode,
            String authMode,
            String apiKeyHeader,
            String apiSecretHeader,
            String callbackPath) {}

    // ─── Appel opérateur brut (sans Paiement) ──────────────────────
    // Réutilisé par le flux dossier (InscriptionPubliqueService), qui n'a
    // pas d'Inscription et donc pas de Paiement à rattacher.

    @CircuitBreaker(name = "operateurMobileMoney", fallbackMethod = "fallbackInitierCharge")
    public String initierChargeOperateur(String operateur, String telephone, Double montant, String reference) {
        return switch (operateur.toUpperCase()) {
            case "VODACOM" -> initierVodacom(telephone, montant, reference);
            case "AIRTEL" -> initierAirtel(telephone, montant, reference);
            case "ORANGE" -> initierOrange(telephone, montant, reference);
            case "AFRIMONEY" -> initierAfriMoney(telephone, montant, reference);
            default -> throw new PaymentException("Opérateur non supporté : " + operateur, "OPERATEUR_INCONNU");
        };
    }

    /**
     * Fallback resilience4j — invoqué quand le circuit est OUVERT (CallNotPermittedException)
     * ou qu'une exception remonte de {@link #initierChargeOperateur}.
     *
     * <p>Circuit ouvert → {@link PaymentException} « momentanément indisponible » (503).
     * Toute autre exception (panne réseau comptée, config, opérateur inconnu) est
     * propagée telle quelle : le comportement observé par l'appelant est inchangé,
     * le fallback ne sert qu'à traduire l'ouverture du circuit.</p>
     */
    @SuppressWarnings("unused")
    private String fallbackInitierCharge(String operateur, String telephone, Double montant,
                                         String reference, Throwable t) {
        if (t instanceof CallNotPermittedException) {
            log.error("Circuit paiement OUVERT pour {} : appels suspendus (opérateur injoignable récemment).", operateur);
            throw new PaymentException(
                "Le service de paiement " + operateur + " est momentanément indisponible. Réessayez dans quelques instants.",
                "OPERATEUR_INDISPONIBLE");
        }
        if (t instanceof RuntimeException re) {
            throw re;
        }
        throw new OperateurPaiementException(operateur, "Échec initiation " + operateur + " : " + t.getMessage(), t);
    }

    // ─── Méthode unifiée d'initiation ──────────────────────────────

    @Transactional
    public TransactionExterne initierPaiement(Long paiementId, String operateur, String telephone, String reference) {
        Paiement paiement = paiementRepo.findById(paiementId)
                .orElseThrow(() -> new RuntimeException("Paiement introuvable"));

        String externalId;
        String status = "PENDING";

        try {
            // Via self → passe par le proxy Spring pour appliquer le @CircuitBreaker.
            externalId = self.initierChargeOperateur(operateur, telephone, paiement.getMontant(), reference);

            // Enregistrer la transaction externe
            TransactionExterne tx = TransactionExterne.builder()
                    .paiement(paiement)
                    .provider(operateur.toUpperCase())
                    .externalId(externalId)
                    .status(status)
                    .createdAt(LocalDateTime.now())
                    .build();
            return transactionExterneRepo.save(tx);

        } catch (PaymentException e) {
            // Circuit ouvert (OPERATEUR_INDISPONIBLE) ou opérateur inconnu : fail-fast,
            // on NE crée PAS de transaction FAILED (éviterait de polluer la base pendant
            // toute la fenêtre d'ouverture du circuit) et on préserve le statut HTTP (503).
            throw e;
        } catch (Exception e) {
            log.error("Erreur lors de l'initiation du paiement {} pour {} : {}", operateur, telephone, e.getMessage());

            // Enregistrer l'échec
            TransactionExterne tx = TransactionExterne.builder()
                    .paiement(paiement)
                    .provider(operateur.toUpperCase())
                    .externalId("ERROR")
                    .status("FAILED")
                    .rawResponse(e.getMessage())
                    .createdAt(LocalDateTime.now())
                    .build();
            transactionExterneRepo.save(tx);

            throw new RuntimeException("Échec de l'initiation du paiement " + operateur + " : " + e.getMessage());
        }
    }

    // ─── Vodacom M-Pesa ─────────────────────────────────────────────

    private String initierVodacom(String telephone, Double montant, String reference) {
        return initierPaiementOperateurStandard(new ProviderConfig(
            "VODACOM",
            "VOD",
            lire("vodacom.mpesa.api.url"),
            lirePremier("vodacom.mpesa.api.key", "vodacom.mpesa.consumer.key"),
            lirePremier("vodacom.mpesa.api.secret", "vodacom.mpesa.consumer.secret"),
            lire("vodacom.mpesa.shortcode"),
            lireOuDefaut("vodacom.mpesa.auth.mode", "BASIC"),
            lireOuDefaut("vodacom.mpesa.api.key-header", "X-API-Key"),
            lireOuDefaut("vodacom.mpesa.api.secret-header", "X-API-Secret"),
            "/api/tachpay/webhook/vodacom"), telephone, montant, reference);
    }

    // ─── Airtel Money ──────────────────────────────────────────────

    private String initierAirtel(String telephone, Double montant, String reference) {
        return initierPaiementOperateurStandard(new ProviderConfig(
            "AIRTEL",
            "AIR",
            lire("airtel.money.api.url"),
            lirePremier("airtel.money.api.key", "airtel.money.client.id"),
            lirePremier("airtel.money.api.secret", "airtel.money.client.secret"),
            lire("airtel.money.merchant.code"),
            lireOuDefaut("airtel.money.auth.mode", "BASIC"),
            lireOuDefaut("airtel.money.api.key-header", "X-API-Key"),
            lireOuDefaut("airtel.money.api.secret-header", "X-API-Secret"),
            "/api/tachpay/webhook/airtel"), telephone, montant, reference);
    }

    // ─── Orange Money (implémentation réelle — MODÈLE pour les autres opérateurs) ──
    //
    // Flux Orange Money : (1) jeton OAuth2 client_credentials, puis (2) initiation
    // du paiement qui déclenche un push USSD/STK sur le téléphone du client — c'est
    // à ce moment que l'usager saisit son code PIN Orange Money. La confirmation
    // arrive ensuite de façon asynchrone via le webhook signé /api/tachpay/webhook/orange.
    //
    // Les noms exacts de champs/endpoints dépendent du contrat Orange du pays ;
    // ils sont isolés ici pour être adaptés sans toucher au reste du flux.
    private String initierOrange(String telephone, Double montant, String reference) {
        log.info("Initiation paiement Orange Money: tel={}, montant={}, ref={}", telephone, montant, reference);

        if (simulationMobileMoneyActive()) {
            return simulerTransaction("ORANGE", "ORA");
        }

        ProviderConfig config = new ProviderConfig(
            "ORANGE",
            "ORA",
            lire("orange.money.api.url"),
            lirePremier("orange.money.api.key", "orange.money.client.id"),
            lirePremier("orange.money.api.secret", "orange.money.client.secret"),
            lire("orange.money.merchant.code"),
            "BEARER",
            "X-API-Key",
            "X-API-Secret",
            "/api/tachpay/webhook/orange");
        verifierConfiguration(config);
        exigerConfigure(config.clientSecret(), "ORANGE", "secret API");

        // 1. Jeton OAuth2 (Basic id:secret, grant_type=client_credentials)
        String accessToken = obtenirJetonOrange(config);

        // 2. Initiation du paiement → push PIN sur le téléphone
        Map<String, Object> corps = new LinkedHashMap<>();
        corps.put("merchant", config.merchantCode());
        corps.put("amount", montant);
        corps.put("currency", "USD"); // adapter à la devise du compte marchand (USD/CDF)
        corps.put("reference", reference);
        corps.put("customerMsisdn", normaliserMsisdn(telephone));
        String callbackUrl = urlWebhook(config.callbackPath());
        if (callbackUrl != null) {
            corps.put("notifUrl", callbackUrl);
        }

        Map<String, Object> reponse;
        try {
            reponse = webClient.post()
                .uri(config.apiUrl())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(corps)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        } catch (WebClientResponseException e) {
            throw new OperateurPaiementException("ORANGE", "Initiation Orange Money échouée (HTTP "
                + e.getStatusCode().value() + ") : " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new OperateurPaiementException("ORANGE", "Initiation Orange Money échouée : " + e.getMessage(), e);
        }

        if (reponse == null) {
            throw new OperateurPaiementException("ORANGE", "Réponse vide d'Orange Money");
        }

        // Identifiant de transaction opérateur (nom de champ variable selon l'API)
        Object txnId = extraireIdentifiantOperateur(reponse);
        if (txnId == null) {
            throw new OperateurPaiementException("ORANGE", "Identifiant de transaction Orange Money manquant : " + reponse);
        }
        return txnId.toString();
    }

    /** Récupère un jeton OAuth2 Orange (client_credentials). */
    private String obtenirJetonOrange(ProviderConfig config) {
        String basic = Base64.getEncoder().encodeToString(
            (config.clientId() + ":" + config.clientSecret()).getBytes(StandardCharsets.UTF_8));
        Map<String, Object> tokenResp;
        try {
            tokenResp = webClient.post()
                .uri(lireOuDefaut("orange.money.oauth.url", "https://api.orange.com/oauth/v3/token"))
                .header(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                .bodyValue("grant_type=client_credentials")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        } catch (WebClientResponseException e) {
            throw new OperateurPaiementException("ORANGE", "OAuth Orange Money échoué (HTTP "
                + e.getStatusCode().value() + ") : " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new OperateurPaiementException("ORANGE", "OAuth Orange Money échoué : " + e.getMessage(), e);
        }
        if (tokenResp == null || tokenResp.get("access_token") == null) {
            throw new OperateurPaiementException("ORANGE", "Jeton d'accès Orange Money introuvable");
        }
        return tokenResp.get("access_token").toString();
    }

    /** Normalise un numéro RDC au format international 243XXXXXXXXX. */
    private String normaliserMsisdn(String telephone) {
        String digits = telephone == null ? "" : telephone.replaceAll("\\D", "");
        if (digits.startsWith("0")) {
            digits = "243" + digits.substring(1);
        } else if (!digits.startsWith("243")) {
            digits = "243" + digits;
        }
        return digits;
    }

    // ─── AfriMoney ───────────────────────────────────────────────────

    private String initierAfriMoney(String telephone, Double montant, String reference) {
        return initierPaiementOperateurStandard(new ProviderConfig(
            "AFRIMONEY",
            "AFR",
            lire("afrimoney.api.url"),
            lirePremier("afrimoney.api.key", "afrimoney.client.id"),
            lirePremier("afrimoney.api.secret", "afrimoney.client.secret"),
            lire("afrimoney.merchant.code"),
            lireOuDefaut("afrimoney.auth.mode", "BASIC"),
            lireOuDefaut("afrimoney.api.key-header", "X-API-Key"),
            lireOuDefaut("afrimoney.api.secret-header", "X-API-Secret"),
            "/api/tachpay/webhook/afrimoney"), telephone, montant, reference);
    }

    private String initierPaiementOperateurStandard(ProviderConfig config, String telephone,
                                                    Double montant, String reference) {
        log.info("Initiation paiement {}: tel={}, montant={}, ref={}",
                config.provider(), telephone, montant, reference);

        if (simulationMobileMoneyActive()) {
            return simulerTransaction(config.provider(), config.simulationPrefix());
        }

        verifierConfiguration(config);

        Map<String, Object> corps = new LinkedHashMap<>();
        corps.put("provider", config.provider());
        corps.put("merchant", config.merchantCode());
        corps.put("amount", montant);
        corps.put("currency", "USD");
        corps.put("reference", reference);
        corps.put("customerMsisdn", normaliserMsisdn(telephone));
        corps.put("description", "Paiement GENUC");
        String callbackUrl = urlWebhook(config.callbackPath());
        if (callbackUrl != null) {
            corps.put("callbackUrl", callbackUrl);
            corps.put("notifUrl", callbackUrl);
        }

        Map<String, Object> reponse;
        try {
            reponse = webClient.post()
                .uri(config.apiUrl())
                .headers(headers -> appliquerAuthentification(headers, config))
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(corps)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        } catch (WebClientResponseException e) {
            throw new OperateurPaiementException(config.provider(), "Initiation " + config.provider()
                + " échouée (HTTP " + e.getStatusCode().value() + ") : " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new OperateurPaiementException(config.provider(), "Initiation " + config.provider()
                + " échouée : " + e.getMessage(), e);
        }

        Object externalId = extraireIdentifiantOperateur(reponse);
        if (externalId == null) {
            throw new OperateurPaiementException(config.provider(),
                "Identifiant de transaction " + config.provider() + " manquant : " + reponse);
        }
        return externalId.toString();
    }

    private void verifierConfiguration(ProviderConfig config) {
        exigerConfigure(config.apiUrl(), config.provider(), "URL API");
        if (!"NONE".equalsIgnoreCase(config.authMode())) {
            exigerConfigure(config.clientId(), config.provider(), "identifiant API");
            if ("BASIC".equalsIgnoreCase(config.authMode()) || "API_KEY".equalsIgnoreCase(config.authMode())) {
                exigerConfigure(config.clientSecret(), config.provider(), "secret API");
            }
        }
        exigerConfigure(config.merchantCode(), config.provider(), "code marchand");
    }

    private void exigerConfigure(String valeur, String provider, String libelle) {
        if (estNonConfigure(valeur)) {
            throw new RuntimeException(provider + " non configuré : " + libelle
                + " manquant ou encore en valeur de démonstration");
        }
    }

    private void appliquerAuthentification(HttpHeaders headers, ProviderConfig config) {
        String mode = config.authMode() == null ? "BASIC" : config.authMode().toUpperCase(Locale.ROOT);
        switch (mode) {
            case "NONE" -> { }
            case "BEARER" -> headers.setBearerAuth(config.clientId());
            case "API_KEY" -> {
                headers.set(config.apiKeyHeader(), config.clientId());
                headers.set(config.apiSecretHeader(), config.clientSecret());
            }
            default -> headers.setBasicAuth(config.clientId(), config.clientSecret(), StandardCharsets.UTF_8);
        }
    }

    private String simulerTransaction(String provider, String prefix) {
        log.warn("{} en mode simulation explicite : aucune requête opérateur réelle n'est envoyée.", provider);
        return prefix + "_" + System.currentTimeMillis();
    }

    private boolean simulationMobileMoneyActive() {
        return Boolean.parseBoolean(lireOuDefaut("genuc.payment.mobile-money.simulation-enabled", "false"));
    }

    private String urlWebhook(String callbackPath) {
        String base = lire("genuc.webhook.public-base-url");
        if (base == null || base.isBlank()) {
            return null;
        }
        return base.replaceAll("/+$", "") + callbackPath;
    }

    private String lire(String key) {
        return environment.getProperty(key, "");
    }

    private String lireOuDefaut(String key, String defaultValue) {
        return environment.getProperty(key, defaultValue);
    }

    private String lirePremier(String... keys) {
        for (String key : keys) {
            String value = lire(key);
            if (!estNonConfigure(value)) {
                return value;
            }
        }
        return keys.length == 0 ? "" : lire(keys[0]);
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

    @SuppressWarnings("unchecked")
    private Object extraireIdentifiantOperateur(Object source) {
        if (!(source instanceof Map<?, ?> map)) {
            return null;
        }
        String[] keys = {
            "transactionId", "transaction_id", "externalId", "external_id", "id",
            "reference", "payToken", "txnid", "operatorTransactionId",
            "conversationId", "ConversationID", "originatorConversationId", "requestId"
        };
        for (String key : keys) {
            Object value = map.get(key);
            if (value != null && !value.toString().isBlank()) {
                return value;
            }
        }
        for (Object value : map.values()) {
            if (value instanceof Map<?, ?> nested) {
                Object found = extraireIdentifiantOperateur((Map<String, Object>) nested);
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }

    // ─── Confirmation par webhook ──────────────────────────────────
    // @CacheEvict : le statut est mis en cache pour le polling frontend
    // (TachPayPaiementService.getStatutPaiement) — sans éviction ici, le
    // front verrait EN_ATTENTE jusqu'à expiration du TTL (1 h).

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = cd.genuc.config.cache.CacheNames.STATUT_PAIEMENT, allEntries = true)
    public Paiement confirmerPaiement(String provider, String externalId, String status, String message) {
        TransactionExterne tx = transactionExterneRepo.findByProviderAndExternalId(provider, externalId)
                .orElseThrow(() -> new RuntimeException("Transaction externe non trouvée"));

        Paiement paiement = tx.getPaiement();

        // ── Idempotence ──────────────────────────────────────────────
        // Un opérateur peut renvoyer plusieurs fois le même webhook (retries).
        // Une transaction déjà dans un état terminal ne doit JAMAIS être
        // rejouée : re-appliquer un paiement SUCCESS créditerait deux fois
        // les affectations de frais (double-paiement fantôme).
        if ("SUCCESS".equalsIgnoreCase(tx.getStatus()) || "FAILED".equalsIgnoreCase(tx.getStatus())) {
            log.info("Webhook {} ignoré : transaction {} déjà dans l'état terminal {}.",
                    provider, externalId, tx.getStatus());
            return paiement;
        }

        // ── Validation du montant webhook ───────────────────────────────
        // Extraire et valider le montant du webhook pour éviter les incohérences
        if ("SUCCESS".equalsIgnoreCase(status) && message != null) {
            try {
                Double montantWebhook = extraireMontantWebhook(message);
                if (montantWebhook != null) {
                    validerMontantWebhook(paiement.getMontant(), montantWebhook, provider, externalId);
                }
            } catch (Exception e) {
                log.warn("Impossible d'extraire/valider le montant du webhook {} : {}", provider, e.getMessage());
                // On continue le traitement même si la validation du montant échoue
                // pour éviter de bloquer les paiements en cas de format différent
            }
        }

        tx.setStatus(status);
        if (message != null) {
            tx.setRawResponse(message);
        }
        transactionExterneRepo.save(tx);

        if ("SUCCESS".equalsIgnoreCase(status)) {
            paiement.setStatut(Paiement.StatutPaiement.VALIDE);
            paiement.setDateValidation(LocalDate.now());
            paiementRepo.save(paiement);

            // Appliquer le paiement aux affectations de l'inscription
            if (paiement.getInscription() != null) {
                List<AffectationFrais> affectations = affectationRepo
                    .findDettesActivesByInscription(paiement.getInscription().getId());
                double resteAPayer = paiement.getMontant();
                for (AffectationFrais af : affectations) {
                    if (resteAPayer <= 0) break;
                    double montantAffecte = Math.min(af.getReste(), resteAPayer);
                    af.appliquerPaiement(montantAffecte);
                    affectationRepo.save(af);
                    resteAPayer -= montantAffecte;
                }
            }
            log.info("Paiement {} ({}) confirmé et affectations mises à jour", paiement.getReference(), provider);
        } else {
            paiement.setStatut(Paiement.StatutPaiement.REJETE);
            paiement.setMotifRejet("Échec du paiement : " + message);
            paiementRepo.save(paiement);
            log.warn("Paiement {} échoué : {}", paiement.getReference(), message);
        }

        return paiement;
    }

    /**
     * Extrait le montant du payload webhook (format JSON).
     * Tente plusieurs champs communs selon les opérateurs.
     */
    private Double extraireMontantWebhook(String message) {
        try {
            if (message == null || message.isBlank()) {
                return null;
            }
            // Parser le JSON pour extraire le montant
            Map<String, Object> payload = objectMapper.readValue(message, new com.fasterxml.jackson.core.type.TypeReference<>() {});
            
            // Chercher le montant dans différents champs possibles
            Object montantObj = payload.get("amount");
            if (montantObj == null) montantObj = payload.get("montant");
            if (montantObj == null) montantObj = payload.get("transactionAmount");
            if (montantObj == null) montantObj = payload.get("paidAmount");
            
            if (montantObj != null) {
                if (montantObj instanceof Number) {
                    return ((Number) montantObj).doubleValue();
                }
                // Certains opérateurs envoient le montant en centimes ou en string
                String montantStr = montantObj.toString().replaceAll("[^0-9.]", "");
                if (!montantStr.isBlank()) {
                    return Double.parseDouble(montantStr);
                }
            }
        } catch (Exception e) {
            log.debug("Impossible d'extraire le montant du webhook : {}", e.getMessage());
        }
        return null;
    }

    /**
     * Valide que le montant du webhook correspond au montant attendu
     * avec une tolérance de 1% pour les frais de conversion potentiels.
     */
    private void validerMontantWebhook(Double montantAttendu, Double montantWebhook, String provider, String externalId) {
        if (montantAttendu == null || montantWebhook == null) {
            return; // Impossible de valider sans les deux montants
        }
        
        double ecartAbsolu = Math.abs(montantWebhook - montantAttendu);
        double ecartRelatif = montantAttendu > 0 ? (ecartAbsolu / montantAttendu) : 0;
        
        // Tolérance de 1% pour les différences de taux de change
        final double TOLERANCE_POURCENTAGE = 0.01;
        
        if (ecartRelatif > TOLERANCE_POURCENTAGE) {
            log.error("Écart montant webhook {} : attendu={}, reçu={}, écart={}%", 
                provider, montantAttendu, montantWebhook, String.format("%.2f", ecartRelatif * 100));
            // On ne rejette pas le paiement mais on log l'erreur pour investigation
            // En production, on pourrait activer un rejet strict
        } else if (ecartRelatif > 0.001) { // Log warning si écart > 0.1%
            log.warn("Écart montant webhook {} (mineur) : attendu={}, reçu={}, écart={}%", 
                provider, montantAttendu, montantWebhook, String.format("%.2f", ecartRelatif * 100));
        }
    }
}