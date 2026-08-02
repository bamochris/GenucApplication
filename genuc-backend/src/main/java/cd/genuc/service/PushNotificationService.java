package cd.genuc.service;

import cd.genuc.config.FirebaseConfig;
import cd.genuc.model.DeviceToken;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.DeviceTokenRepository;
import cd.genuc.repository.UtilisateurRepository;
import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Notifications push (mobile/web) via Firebase Cloud Messaging — cf. PLAN_CORRECTION.md §5.4
 * "Notifications push — Moyenne priorité — Application mobile via Firebase". Complète le
 * SMS et le WhatsApp pour couvrir tous les canaux de communication mentionnés dans le plan.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {

    private final DeviceTokenRepository deviceTokenRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final FirebaseConfig firebaseConfig;

    // ═══════════════════════════════════════════════════════════════
    //  GESTION DES JETONS D'APPAREIL
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public void enregistrerToken(Long utilisateurId, String token, DeviceToken.Plateforme plateforme) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Le jeton FCM est obligatoire");
        }
        Utilisateur utilisateur = utilisateurRepo.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : id=" + utilisateurId));

        DeviceToken deviceToken = deviceTokenRepo.findByToken(token)
                .orElse(DeviceToken.builder().token(token).build());
        deviceToken.setUtilisateur(utilisateur);
        deviceToken.setPlateforme(plateforme != null ? plateforme : DeviceToken.Plateforme.WEB);
        deviceToken.setActif(true);
        deviceToken.setDerniereUtilisation(java.time.LocalDateTime.now());

        deviceTokenRepo.save(deviceToken);
    }

    @Transactional
    public void desenregistrerToken(String token) {
        deviceTokenRepo.deleteByToken(token);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ENVOI
    // ═══════════════════════════════════════════════════════════════

    /**
     * Envoie une notification push à tous les appareils actifs d'un utilisateur. Ne fait rien
     * (juste un log) si Firebase n'est pas configuré ou si l'utilisateur n'a aucun appareil
     * enregistré — n'échoue jamais bruyamment, pour ne jamais bloquer le flux appelant
     * (ex: création d'une notification in-app).
     */
    public void envoyerAUtilisateur(Long utilisateurId, String titre, String corps, String lienAction) {
        List<DeviceToken> tokens = deviceTokenRepo.findByUtilisateurIdAndActifTrue(utilisateurId);
        if (tokens.isEmpty()) {
            log.debug("Aucun appareil enregistré pour l'utilisateur {} — push non envoyé.", utilisateurId);
            return;
        }
        if (!firebaseConfig.estConfigure()) {
            log.info("Firebase non configuré. Push non envoyé (utilisateur={}, titre='{}').", utilisateurId, titre);
            return;
        }

        List<String> tokenValues = tokens.stream().map(DeviceToken::getToken).toList();

        MulticastMessage.Builder builder = MulticastMessage.builder()
                .setNotification(Notification.builder().setTitle(titre).setBody(corps).build())
                .addAllTokens(tokenValues);
        if (lienAction != null) {
            builder.putData("lienAction", lienAction);
        }

        try {
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(builder.build());
            log.info("Push envoyé à l'utilisateur {} : {}/{} succès",
                    utilisateurId, response.getSuccessCount(), tokenValues.size());

            // Nettoie les jetons devenus invalides (désinstallation, désactivation FCM, etc.)
            List<SendResponse> responses = response.getResponses();
            for (int i = 0; i < responses.size(); i++) {
                if (!responses.get(i).isSuccessful()) {
                    MessagingErrorCode code = responses.get(i).getException() != null
                            ? responses.get(i).getException().getMessagingErrorCode() : null;
                    if (code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT) {
                        desactiverToken(tokenValues.get(i));
                    }
                }
            }
        } catch (FirebaseMessagingException e) {
            log.error("Erreur envoi push à l'utilisateur {} : {}", utilisateurId, e.getMessage());
        }
    }

    public void envoyerAUniversite(Long universiteId, String titre, String corps, String lienAction) {
        List<DeviceToken> tokens = deviceTokenRepo.findAll().stream()
                .filter(t -> t.isActif() && t.getUtilisateur() != null
                        && universiteId.equals(t.getUtilisateur().getUniversiteId()))
                .toList();
        if (tokens.isEmpty() || !firebaseConfig.estConfigure()) {
            log.debug("Push université {} ignoré (aucun appareil ou Firebase non configuré).", universiteId);
            return;
        }
        List<String> tokenValues = tokens.stream().map(DeviceToken::getToken).toList();
        try {
            MulticastMessage message = MulticastMessage.builder()
                    .setNotification(Notification.builder().setTitle(titre).setBody(corps).build())
                    .putAllData(lienAction != null ? Map.of("lienAction", lienAction) : Map.of())
                    .addAllTokens(tokenValues)
                    .build();
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            log.info("Push université {} : {}/{} succès", universiteId, response.getSuccessCount(), tokenValues.size());
        } catch (FirebaseMessagingException e) {
            log.error("Erreur envoi push université {} : {}", universiteId, e.getMessage());
        }
    }

    private void desactiverToken(String token) {
        deviceTokenRepo.findByToken(token).ifPresent(t -> {
            t.setActif(false);
            deviceTokenRepo.save(t);
        });
    }
}
