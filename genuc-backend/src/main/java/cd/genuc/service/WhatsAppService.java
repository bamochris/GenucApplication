package cd.genuc.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * WhatsApp Business Cloud API (Meta) — notifications des résultats, infos inscriptions.
 * Très utilisé en RDC (cf. PLAN_CORRECTION.md §5.4), en complément du SMS (Africa's Talking).
 *
 * Nécessite un numéro WhatsApp Business vérifié + un token d'accès permanent (Meta for
 * Developers). En dehors de la fenêtre de service client de 24h, seuls les messages basés
 * sur un template pré-approuvé peuvent être envoyés — {@link #envoyerTemplate} couvre ce cas.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class WhatsAppService {

    @Value("${whatsapp.api.url:https://graph.facebook.com/v19.0}")
    private String apiUrl;

    @Value("${whatsapp.phone-number-id:DUMMY}")
    private String phoneNumberId;

    @Value("${whatsapp.access-token:DUMMY}")
    private String accessToken;

    @Value("${whatsapp.enabled:false}")
    private boolean whatsappEnabled;

    private WebClient webClient;

    private WebClient getWebClient() {
        if (webClient == null && !"DUMMY".equals(phoneNumberId) && !"DUMMY".equals(accessToken)) {
            webClient = WebClient.builder()
                    .baseUrl(apiUrl + "/" + phoneNumberId)
                    .defaultHeader("Authorization", "Bearer " + accessToken)
                    .defaultHeader("Content-Type", "application/json")
                    .build();
        }
        return webClient;
    }

    /**
     * Convertit un numéro local (ex: "081234567" ou "+243812345678") au format E.164 sans "+"
     * attendu par l'API WhatsApp. RDC par défaut si aucun indicatif n'est présent.
     */
    private String normaliserNumero(String telephone) {
        String digits = telephone.replaceAll("[^0-9]", "");
        if (telephone.trim().startsWith("+")) return digits;
        if (digits.startsWith("243")) return digits;
        if (digits.startsWith("0")) return "243" + digits.substring(1);
        return "243" + digits;
    }

    /**
     * Envoie un message texte libre — uniquement valide si le destinataire a interagi avec
     * le compte WhatsApp Business dans les dernières 24h (fenêtre de service client Meta).
     */
    public void envoyerMessage(String telephone, String message) {
        if (!whatsappEnabled) {
            log.info("WhatsApp désactivé. Message non envoyé à {} : {}", telephone, message);
            return;
        }
        if (telephone == null || telephone.isBlank()) {
            log.warn("Numéro de téléphone invalide, message WhatsApp non envoyé.");
            return;
        }
        WebClient client = getWebClient();
        if (client == null) {
            log.warn("Service WhatsApp non configuré (clés factices). Message non envoyé.");
            return;
        }
        try {
            client.post()
                    .uri("/messages")
                    .bodyValue(Map.of(
                            "messaging_product", "whatsapp",
                            "to", normaliserNumero(telephone),
                            "type", "text",
                            "text", Map.of("body", message)
                    ))
                    .retrieve()
                    .bodyToMono(String.class)
                    .subscribe(
                            response -> log.info("Message WhatsApp envoyé à {} : réponse={}", telephone, response),
                            erreur -> log.error("Échec envoi WhatsApp à {} : {}", telephone, erreur.getMessage())
                    );
        } catch (Exception e) {
            log.error("Erreur envoi WhatsApp à {} : {}", telephone, e.getMessage());
        }
    }

    /**
     * Envoie un message basé sur un template pré-approuvé Meta — seul moyen d'initier une
     * conversation en dehors de la fenêtre de 24h (ex: notification de résultats).
     */
    public void envoyerTemplate(String telephone, String nomTemplate, String langue, java.util.List<String> parametres) {
        if (!whatsappEnabled) {
            log.info("WhatsApp désactivé. Template '{}' non envoyé à {}", nomTemplate, telephone);
            return;
        }
        WebClient client = getWebClient();
        if (client == null) {
            log.warn("Service WhatsApp non configuré (clés factices). Template non envoyé.");
            return;
        }
        try {
            java.util.List<Map<String, Object>> composants = parametres == null || parametres.isEmpty()
                    ? java.util.List.of()
                    : java.util.List.of(Map.of(
                            "type", "body",
                            "parameters", parametres.stream()
                                    .map(p -> Map.of("type", "text", "text", p))
                                    .toList()
                      ));

            client.post()
                    .uri("/messages")
                    .bodyValue(Map.of(
                            "messaging_product", "whatsapp",
                            "to", normaliserNumero(telephone),
                            "type", "template",
                            "template", Map.of(
                                    "name", nomTemplate,
                                    "language", Map.of("code", langue != null ? langue : "fr"),
                                    "components", composants
                            )
                    ))
                    .retrieve()
                    .bodyToMono(String.class)
                    .subscribe(
                            response -> log.info("Template WhatsApp '{}' envoyé à {} : réponse={}", nomTemplate, telephone, response),
                            erreur -> log.error("Échec envoi template WhatsApp '{}' à {} : {}", nomTemplate, telephone, erreur.getMessage())
                    );
        } catch (Exception e) {
            log.error("Erreur envoi template WhatsApp '{}' à {} : {}", nomTemplate, telephone, e.getMessage());
        }
    }
}
