package cd.genuc.repository;

import cd.genuc.model.Notification;
import cd.genuc.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByDestinataireOrderByDateEnvoiDesc(Utilisateur destinataire);

    List<Notification> findByDestinataireAndLueFalseOrderByDateEnvoiDesc(Utilisateur destinataire);

    List<Notification> findByUniversiteIdOrderByDateEnvoiDesc(Long universiteId);

    List<Notification> findByCoursIdOrderByDateEnvoiDesc(Long coursId);

    long countByDestinataireAndLueFalse(Utilisateur destinataire);

    @Query("SELECT n FROM Notification n WHERE n.destinataire.id = :userId AND n.dateEnvoi >= :since")
    List<Notification> findRecentByUser(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Query("SELECT n FROM Notification n WHERE n.destinataire.id = :userId AND n.lue = false")
    List<Notification> findNonLuesByUser(@Param("userId") Long userId);
}