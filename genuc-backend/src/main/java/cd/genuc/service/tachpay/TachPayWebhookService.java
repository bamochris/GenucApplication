package cd.genuc.service.tachpay;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TachPayWebhookService {

    private final MobileMoneyService mobileMoneyService;
    private final StripeService stripeService;
    private final ObjectMapper objectMapper;
    private final cd.genuc.repository.TransactionExterneRepository transactionExterneRepo;
    private final cd.genuc.service.InscriptionPubliqueService inscriptionPubliqueService;

    public Map<String, Object> traiterWebhookVodacom(Map<String, Object> payload) {
        return traiterWebhookMobile("VODACOM", payload);
    }

    public Map<String, Object> traiterWebhookAirtel(Map<String, Object> payload) {
        return traiterWebhookMobile("AIRTEL", payload);
    }

    public Map<String, Object> traiterWebhookOrange(Map<String, Object> payload) {
        return traiterWebhookMobile("ORANGE", payload);
    }

    public Map<String, Object> traiterWebhookAfriMoney(Map<String, Object> payload) {
        return traiterWebhookMobile("AFRIMONEY", payload);
    }

    public Map<String, Object> traiterWebhookStripe(String payload, String signature) {
        // Sécurité : en prod, le corps brut doit être signé (Stripe-Signature)
        // et un webhook secret doit être configuré. Le contournement n'existe
        // qu'en dev explicite via stripe.webhook.require-signature=false.
        if (!stripeService.signatureWebhookValide(payload, signature)) {
            throw new RuntimeException("Signature du webhook Stripe invalide");
        }
        try {
            Map<String, Object> event = objectMapper.readValue(payload, new TypeReference<>() {});
            String type = (String) event.get("type");

            if ("checkout.session.completed".equals(type)) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) event.get("data");
                @SuppressWarnings("unchecked")
                Map<String, Object> object = (Map<String, Object>) data.get("object");
                String sessionId = (String) object.get("id");
                String paymentIntent = (String) object.get("payment_intent");
                
                // Idempotence : vérifier si déjà traité
                var existingStripeTx = transactionExterneRepo.findByProviderAndExternalId("STRIPE", sessionId);
                if (existingStripeTx.isPresent() && "SUCCESS".equals(existingStripeTx.get().getStatus())) {
                    log.warn("Webhook Stripe déjà traité pour session {} - statut SUCCESS, ignore duplication", sessionId);
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("received", true);
                    result.put("already_processed", true);
                    result.put("type", type);
                    result.put("session_id", sessionId);
                    return result;
                }
                
                // Deux flux partagent le webhook Stripe : frais académiques
                // (TransactionExterne, avec Paiement/Inscription) et frais de
                // DOSSIER (TransactionDossier, candidat sans compte).
                if (transactionExterneRepo.findByProviderAndExternalId("STRIPE", sessionId).isPresent()) {
                    stripeService.confirmerPaiement(sessionId, paymentIntent, "succeeded");
                } else {
                    inscriptionPubliqueService.confirmerPaiementFraisDossier(
                        "STRIPE", sessionId, "SUCCESS", payload);
                }
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("received", true);
            result.put("type", type);
            return result;
        } catch (Exception e) {
            log.error("Erreur traitement webhook Stripe : {}", e.getMessage());
            throw new RuntimeException("Webhook Stripe invalide : " + e.getMessage());
        }
    }

    private Map<String, Object> traiterWebhookMobile(String provider, Map<String, Object> payload) {
        String externalId = extraireChamp(payload, "transactionId", "externalId", "id", "reference");
        String statusBrut = extraireChamp(payload, "status", "resultCode", "result", "transactionStatus");
        String status = mapperStatutMobile(statusBrut);

        // Idempotence : vérifier si la transaction a déjà été traitée avec succès
        var existingTx = transactionExterneRepo.findByProviderAndExternalId(provider, externalId);
        if (existingTx.isPresent() && "SUCCESS".equals(existingTx.get().getStatus())) {
            log.warn("Webhook {} déjà traité pour transaction {} - statut SUCCESS, ignore duplication", provider, externalId);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("received", true);
            result.put("already_processed", true);
            result.put("provider", provider);
            result.put("externalId", externalId);
            result.put("status", existingTx.get().getStatus());
            return result;
        }

        // Deux flux partagent les webhooks opérateur : frais académiques
        // (TransactionExterne) et frais de DOSSIER (TransactionDossier).
        if (transactionExterneRepo.findByProviderAndExternalId(provider, externalId).isPresent()) {
            mobileMoneyService.confirmerPaiement(provider, externalId, status, payload.toString());
        } else {
            inscriptionPubliqueService.confirmerPaiementFraisDossier(
                provider, externalId, status, payload.toString());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("received", true);
        result.put("provider", provider);
        result.put("externalId", externalId);
        result.put("status", status);
        return result;
    }

    private String extraireChamp(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value != null && !value.toString().isBlank()) {
                return value.toString();
            }
        }
        throw new RuntimeException("Champ obligatoire manquant dans le webhook");
    }

    private String mapperStatutMobile(String statusBrut) {
        if (statusBrut == null) {
            return "FAILED";
        }
        String normalized = statusBrut.toUpperCase();
        if (normalized.contains("SUCCESS") || normalized.contains("COMPLETED") || "0".equals(normalized)) {
            return "SUCCESS";
        }
        if (normalized.contains("PENDING") || normalized.contains("PROCESSING")) {
            return "PENDING";
        }
        return "FAILED";
    }
}
