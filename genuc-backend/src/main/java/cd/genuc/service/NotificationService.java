package cd.genuc.service;

import cd.genuc.model.Notification;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final PushNotificationService pushNotificationService;

    @Transactional
    public Notification envoyerNotification(Utilisateur destinataire, String titre, String message,
                                            Notification.TypeNotification type, String lienAction) {
        Notification notif = Notification.builder()
                .titre(titre)
                .message(message)
                .type(type)
                .destinataire(destinataire)
                .lienAction(lienAction)
                .lue(false)
                .dateEnvoi(LocalDateTime.now())
                .build();
        notif = notificationRepo.save(notif);

        // Notification push (mobile/web) en complément de la notification in-app —
        // ne bloque jamais le flux appelant si Firebase n'est pas configuré.
        if (destinataire != null && destinataire.getId() != null) {
            pushNotificationService.envoyerAUtilisateur(destinataire.getId(), titre, message, lienAction);
        }

        return notif;
    }

    @Transactional
    public Notification envoyerNotificationUniversite(Long universiteId, String titre, String message,
                                                      Notification.TypeNotification type, String lienAction) {
        Notification notif = Notification.builder()
                .titre(titre)
                .message(message)
                .type(type)
                .universiteId(universiteId)
                .lienAction(lienAction)
                .lue(false)
                .dateEnvoi(LocalDateTime.now())
                .build();
        notif = notificationRepo.save(notif);

        if (universiteId != null) {
            pushNotificationService.envoyerAUniversite(universiteId, titre, message, lienAction);
        }

        return notif;
    }

    public List<Notification> getNotificationsUtilisateur(Long userId) {
        Utilisateur user = new Utilisateur();
        user.setId(userId);
        return notificationRepo.findByDestinataireOrderByDateEnvoiDesc(user);
    }

    public List<Notification> getNotificationsNonLues(Long userId) {
        Utilisateur user = new Utilisateur();
        user.setId(userId);
        return notificationRepo.findByDestinataireAndLueFalseOrderByDateEnvoiDesc(user);
    }

    public long countNonLues(Long userId) {
        Utilisateur user = new Utilisateur();
        user.setId(userId);
        return notificationRepo.countByDestinataireAndLueFalse(user);
    }

    @Transactional
    public Notification marquerLue(Long notificationId) {
        Notification notif = notificationRepo.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));
        notif.setLue(true);
        notif.setDateLecture(LocalDateTime.now());
        return notificationRepo.save(notif);
    }

    @Transactional
    public void marquerToutesLues(Long userId) {
        List<Notification> nonLues = getNotificationsNonLues(userId);
        for (Notification n : nonLues) {
            n.setLue(true);
            n.setDateLecture(LocalDateTime.now());
        }
        notificationRepo.saveAll(nonLues);
    }

    public List<Notification> getNotificationsParUniversite(Long universiteId) {
        return notificationRepo.findByUniversiteIdOrderByDateEnvoiDesc(universiteId);
    }
}