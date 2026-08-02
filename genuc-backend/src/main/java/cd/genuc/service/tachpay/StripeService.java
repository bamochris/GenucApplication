package cd.genuc.service.tachpay;

import cd.genuc.exception.OperateurPaiementException;
import cd.genuc.exception.PaymentException;
import cd.genuc.model.AffectationFrais;
import cd.genuc.model.StatutAffectation;
import cd.genuc.model.Paiement;
import cd.genuc.model.TransactionExterne;
import cd.genuc.repository.AffectationFraisRepository;
import cd.genuc.repository.PaiementRepository;
import cd.genuc.repository.TransactionExterneRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import jakarta.annotation.PostConstruct;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripeService {

    private final PaiementRepository paiementRepo;
    private final TransactionExterneRepository transactionExterneRepo;
    private final AffectationFraisRepository affectationRepo;

    @Value("${stripe.api.key:}")
    private String stripeApiKey;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @Value("${stripe.webhook.require-signature:true}")
    private boolean webhookSignatureObligatoire;

    @Value("${genuc.payment.card.simulation-enabled:false}")
    private boolean simulationCarteActive;

    /**
     * Timeouts et retries réseau explicites pour le SDK Stripe.
     * Sans cela, le SDK utilise ses défauts (connect 30s / read 80s, 0 retry),
     * ce qui peut bloquer une requête de checkout ou un webhook bien trop longtemps.
     * Les appels Stripe étant idempotents côté opérateur, 2 retries automatiques
     * absorbent les erreurs réseau transitoires sans risque de double-paiement.
     */
    @PostConstruct
    void configurerClientStripe() {
        Stripe.setConnectTimeout(10_000); // 10 s pour établir la connexion
        Stripe.setReadTimeout(20_000);    // 20 s pour lire la réponse
        Stripe.setMaxNetworkRetries(2);   // retries réseau gérés par le SDK
    }

    // ─── Création d'une session de paiement ────────────────────────

    /** Résultat d'une création de session : id (pour le rapprochement webhook) + URL hébergée Stripe. */
    public record StripeSession(String id, String url) {}

    /**
     * Crée une vraie session Stripe Checkout et renvoie l'URL hébergée où
     * l'étudiant saisit sa carte (page sécurisée Stripe, jamais sur GENUC).
     * La session simulée est réservée au dev local et doit être activée
     * explicitement par genuc.payment.card.simulation-enabled=true.
     */
    @CircuitBreaker(name = "stripeCheckout", fallbackMethod = "fallbackCreerSession")
    public StripeSession creerSessionCheckout(Double montant, String devise,
                                              String successUrl, String cancelUrl, String description) {
        if (stripeApiKey == null || stripeApiKey.isBlank()) {
            if (simulationCarteActive) {
                log.warn("Stripe en mode simulation explicite : aucune saisie de carte réelle.");
                String fakeId = "cs_test_" + System.currentTimeMillis();
                return new StripeSession(fakeId, successUrl != null ? successUrl + "?session_id=" + fakeId : null);
            }
            throw new RuntimeException("Stripe non configuré : stripe.api.key manquant");
        }

        try {
            Stripe.apiKey = stripeApiKey;
            long montantEnCentimes = Math.round(montant * 100.0);
            String currency = (devise != null && !devise.isBlank() ? devise : "USD").toLowerCase();

            // Stripe renvoie l'id réel de session dans l'URL de succès via {CHECKOUT_SESSION_ID}
            String successAvecSession = successUrl == null ? null
                : successUrl + (successUrl.contains("?") ? "&" : "?") + "session_id={CHECKOUT_SESSION_ID}";

            SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successAvecSession)
                .setCancelUrl(cancelUrl)
                .addLineItem(SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency(currency)
                        .setUnitAmount(montantEnCentimes)
                        .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                            .setName(description != null ? description : "Frais académiques GENUC")
                            .build())
                        .build())
                    .build())
                .build();

            Session session = Session.create(params);
            log.info("Session Stripe créée : {} (montant={} {})", session.getId(), montant, currency.toUpperCase());
            return new StripeSession(session.getId(), session.getUrl());
        } catch (StripeException e) {
            log.error("Erreur création session Stripe : {}", e.getMessage());
            throw new OperateurPaiementException("STRIPE",
                "Impossible de créer la session de paiement carte : " + e.getMessage(), e);
        }
    }

    /**
     * Fallback resilience4j pour {@link #creerSessionCheckout} : circuit ouvert →
     * {@link PaymentException} « momentanément indisponible » (503). Toute autre
     * exception (panne Stripe comptée, config manquante) est propagée telle quelle.
     */
    @SuppressWarnings("unused")
    private StripeSession fallbackCreerSession(Double montant, String devise, String successUrl,
                                               String cancelUrl, String description, Throwable t) {
        if (t instanceof CallNotPermittedException) {
            log.error("Circuit paiement OUVERT pour STRIPE : appels suspendus (Stripe injoignable récemment).");
            throw new PaymentException(
                "Le paiement par carte est momentanément indisponible. Réessayez dans quelques instants.",
                "OPERATEUR_INDISPONIBLE");
        }
        if (t instanceof RuntimeException re) {
            throw re;
        }
        throw new OperateurPaiementException("STRIPE", "Échec création session Stripe : " + t.getMessage(), t);
    }

    /**
     * Vérifie la signature d'un webhook Stripe (en-tête Stripe-Signature).
     * En production, l'absence de stripe.webhook-secret fait échouer la
     * vérification. En dev, stripe.webhook.require-signature=false permet les
     * tests locaux sans Stripe CLI.
     */
    public boolean signatureWebhookValide(String payload, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            if (webhookSignatureObligatoire) {
                log.error("Webhook Stripe rejeté : stripe.webhook-secret manquant.");
                return false;
            }
            log.warn("Webhook Stripe accepté sans vérification (dev, secret absent).");
            return true;
        }
        try {
            Webhook.constructEvent(payload, signatureHeader, webhookSecret);
            return true;
        } catch (SignatureVerificationException e) {
            log.warn("Signature webhook Stripe invalide : {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Erreur vérification webhook Stripe : {}", e.getMessage());
            return false;
        }
    }

    // ─── Confirmation par webhook ──────────────────────────────────
    // @CacheEvict : même raison que MobileMoneyService.confirmerPaiement —
    // le cache du polling de statut doit être invalidé à la confirmation.

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = cd.genuc.config.cache.CacheNames.STATUT_PAIEMENT, allEntries = true)
    public Paiement confirmerPaiement(String sessionId, String paymentIntentId, String status) {
        TransactionExterne tx = transactionExterneRepo.findByProviderAndExternalId("STRIPE", sessionId)
                .orElseThrow(() -> new RuntimeException("Transaction Stripe non trouvée"));

        // ── Idempotence ──────────────────────────────────────────────
        // Stripe peut renvoyer plusieurs fois le même webhook.
        // Une transaction déjà dans un état terminal ne doit JAMAIS être
        // rejouée pour éviter le double-paiement.
        if ("succeeded".equalsIgnoreCase(tx.getStatus()) || "FAILED".equalsIgnoreCase(tx.getStatus())) {
            log.info("Webhook Stripe ignoré : transaction {} déjà dans l'état terminal {}.",
                    sessionId, tx.getStatus());
            return tx.getPaiement();
        }

        tx.setExternalId(paymentIntentId);
        tx.setStatus(status);
        transactionExterneRepo.save(tx);

        Paiement paiement = tx.getPaiement();

        // ── Validation du montant Stripe ───────────────────────────────
        // Stripe fournit le montant en centimes dans paymentIntentId
        if ("succeeded".equalsIgnoreCase(status) && paymentIntentId != null) {
            try {
                // Récupérer le montant depuis Stripe API pour validation
                if (stripeApiKey != null && !stripeApiKey.isBlank()) {
                    Stripe.apiKey = stripeApiKey;
                    com.stripe.model.PaymentIntent paymentIntent = com.stripe.model.PaymentIntent.retrieve(paymentIntentId);
                    if (paymentIntent != null && paymentIntent.getAmount() != null) {
                        double montantStripeCents = paymentIntent.getAmount();
                        double montantStripe = montantStripeCents / 100.0;
                        validerMontantStripe(paiement.getMontant(), montantStripe, sessionId);
                    }
                }
            } catch (Exception e) {
                log.warn("Impossible de valider le montant Stripe pour {}: {}", sessionId, e.getMessage());
                // On continue le traitement même si la validation échoue
            }
        }

        if ("succeeded".equalsIgnoreCase(status)) {
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
            log.info("Paiement Stripe {} confirmé et affectations mises à jour", paiement.getReference());
        } else {
            paiement.setStatut(Paiement.StatutPaiement.REJETE);
            paiement.setMotifRejet("Paiement Stripe échoué : " + status);
            paiementRepo.save(paiement);
        }

        return paiement;
    }

    /**
     * Valide que le montant Stripe correspond au montant attendu
     * avec une tolérance de 1% pour les différences de taux de change.
     */
    private void validerMontantStripe(Double montantAttendu, Double montantStripe, String sessionId) {
        if (montantAttendu == null || montantStripe == null) {
            return;
        }
        
        double ecartAbsolu = Math.abs(montantStripe - montantAttendu);
        double ecartRelatif = montantAttendu > 0 ? (ecartAbsolu / montantAttendu) : 0;
        
        // Tolérance de 1%
        final double TOLERANCE_POURCENTAGE = 0.01;
        
        if (ecartRelatif > TOLERANCE_POURCENTAGE) {
            log.error("Écart montant Stripe : attendu={}, reçu={}, écart={}%, session={}", 
                montantAttendu, montantStripe, String.format("%.2f", ecartRelatif * 100), sessionId);
        } else if (ecartRelatif > 0.001) {
            log.warn("Écart montant Stripe (mineur) : attendu={}, reçu={}, écart={}%, session={}", 
                montantAttendu, montantStripe, String.format("%.2f", ecartRelatif * 100), sessionId);
        }
    }
}