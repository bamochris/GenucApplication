package cd.genuc.repository;

import cd.genuc.model.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    List<DeviceToken> findByUtilisateurIdAndActifTrue(Long utilisateurId);

    Optional<DeviceToken> findByToken(String token);

    void deleteByToken(String token);
}
