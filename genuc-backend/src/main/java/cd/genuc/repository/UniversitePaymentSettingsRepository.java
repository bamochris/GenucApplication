package cd.genuc.repository;

import cd.genuc.model.UniversitePaymentSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UniversitePaymentSettingsRepository extends JpaRepository<UniversitePaymentSettings, Long> {
    Optional<UniversitePaymentSettings> findByUniversiteId(Long universiteId);
}
