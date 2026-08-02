package cd.genuc.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.util.Base64;

/**
 * Initialise Firebase Admin SDK pour l'envoi de notifications push (FCM). Optionnel : si
 * aucune clé de compte de service n'est configurée, l'application démarre normalement et
 * {@link cd.genuc.service.PushNotificationService} journalise simplement les envois sans
 * les effectuer (même convention que les autres intégrations externes du projet).
 */
@Component
@Slf4j
public class FirebaseConfig {

    // Contenu JSON du compte de service Firebase, encodé en base64 (variable d'environnement,
    // pour éviter de committer un fichier de clé dans le dépôt).
    @Value("${firebase.credentials.base64:}")
    private String credentialsBase64;

    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    @PostConstruct
    public void initialiser() {
        if (!firebaseEnabled || credentialsBase64 == null || credentialsBase64.isBlank()) {
            log.info("Firebase désactivé ou non configuré — les notifications push seront journalisées sans être envoyées.");
            return;
        }
        try {
            byte[] jsonBytes = Base64.getDecoder().decode(credentialsBase64);
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(new ByteArrayInputStream(jsonBytes));

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialisé avec succès.");
            }
        } catch (Exception e) {
            log.error("Échec de l'initialisation de Firebase Admin SDK : {}", e.getMessage());
        }
    }

    public boolean estConfigure() {
        return firebaseEnabled && !FirebaseApp.getApps().isEmpty();
    }
}
