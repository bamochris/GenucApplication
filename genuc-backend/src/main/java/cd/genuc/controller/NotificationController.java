package cd.genuc.controller;

import cd.genuc.model.Notification;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/mes-notifications")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Notification>> getMesNotifications(@AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.ok(notificationService.getNotificationsUtilisateur(user.getId()));
    }

    @GetMapping("/mes-notifications/non-lues")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Notification>> getMesNotificationsNonLues(@AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.ok(notificationService.getNotificationsNonLues(user.getId()));
    }

    @GetMapping("/non-lues/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> countNonLues(@AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.ok(Map.of("count", notificationService.countNonLues(user.getId())));
    }

    @PatchMapping("/{id}/lue")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> marquerLue(@PathVariable Long id) {
        notificationService.marquerLue(id);
        return ResponseEntity.ok(Map.of("message", "Notification marquée comme lue"));
    }

    @PatchMapping("/tout-lire")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> marquerToutesLues(@AuthenticationPrincipal Utilisateur user) {
        notificationService.marquerToutesLues(user.getId());
        return ResponseEntity.ok(Map.of("message", "Toutes les notifications ont été marquées comme lues"));
    }

    // Admin : envoyer une notification à une université
    @PostMapping("/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> envoyerAUniversite(
            @PathVariable Long universiteId,
            @RequestBody Map<String, String> body) {
        try {
            if (!body.containsKey("titre") || !body.containsKey("message") || !body.containsKey("type")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "titre, message et type sont requis"));
            }
            Notification notif = notificationService.envoyerNotificationUniversite(
                    universiteId,
                    body.get("titre"),
                    body.get("message"),
                    Notification.TypeNotification.valueOf(body.get("type")),
                    body.get("lienAction")
            );
            return ResponseEntity.ok(notif);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}