package cd.genuc.repository;

import cd.genuc.model.ParametresNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParametresNotificationRepository extends JpaRepository<ParametresNotification, Long> {

    Optional<ParametresNotification> findByUtilisateurId(Long utilisateurId);
}