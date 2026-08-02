package cd.genuc.controller;

import cd.genuc.model.DeviceToken;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Enregistrement des jetons FCM (Firebase Cloud Messaging) — appelé par l'application
 * mobile/web après obtention du jeton, pour recevoir les notifications push.
 */
@RestController
@RequestMapping("/api/notifications/push")
@RequiredArgsConstructor
public class DeviceTokenController {

    private final PushNotificationService pushNotificationService;

    @PostMapping("/enregistrer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> enregistrer(@AuthenticationPrincipal Utilisateur utilisateur,
                                          @RequestBody Map<String, String> body) {
        if (utilisateur == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            String token = body.get("token");
            DeviceToken.Plateforme plateforme = body.get("plateforme") != null
                    ? DeviceToken.Plateforme.valueOf(body.get("plateforme")) : DeviceToken.Plateforme.WEB;
            pushNotificationService.enregistrerToken(utilisateur.getId(), token, plateforme);
            return ResponseEntity.ok(Map.of("message", "Jeton enregistré"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/desenregistrer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> desenregistrer(@RequestBody Map<String, String> body) {
        pushNotificationService.desenregistrerToken(body.get("token"));
        return ResponseEntity.ok(Map.of("message", "Jeton désenregistré"));
    }
}
