package cd.genuc.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import org.springframework.scheduling.annotation.Async;

@Service
@Slf4j
@RequiredArgsConstructor
public class SmsService {

    @Value("${africastalking.api.key:DUMMY}")
    private String apiKey;

    @Value("${africastalking.username:DUMMY}")
    private String username;

    @Value("${africastalking.shortcode:DUMMY}")
    private String shortcode;

    @Value("${sms.enabled:false}")
    private boolean smsEnabled;

    private WebClient webClient;

    private WebClient getWebClient() {
        if (webClient == null && !"DUMMY".equals(apiKey) && !"DUMMY".equals(username)) {
            webClient = WebClient.builder()
                    .baseUrl("https://api.africastalking.com/version1")
                    .defaultHeader("apiKey", apiKey)
                    .defaultHeader("Content-Type", "application/json")
                    .build();
        }
        return webClient;
    }

    @Async
    public void envoyerSms(String telephone, String message) {
        if (!smsEnabled) {
            log.info("SMS désactivé. Message non envoyé à {} : {}", telephone, message);
            return;
        }
        if (telephone == null || telephone.isBlank()) {
            log.warn("Numéro de téléphone invalide, SMS non envoyé.");
            return;
        }
        if ("DUMMY".equals(apiKey) || "DUMMY".equals(username)) {
            log.warn("Service SMS non configuré (clés factices). Message non envoyé.");
            return;
        }
        try {
            WebClient client = getWebClient();
            if (client == null) {
                log.warn("WebClient non initialisé, SMS non envoyé.");
                return;
            }
            client.post()
                    .uri("/messaging")
                    .bodyValue(Map.of(
                            "username", username,
                            "to", telephone,
                            "message", message,
                            "from", shortcode
                    ))
                    .retrieve()
                    .bodyToMono(String.class)
                    .subscribe(response -> log.info("SMS envoyé à {} : réponse={}", telephone, response));
        } catch (Exception e) {
            log.error("Erreur envoi SMS à {} : {}", telephone, e.getMessage());
        }
    }
}