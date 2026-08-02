package cd.genuc.repository;

import cd.genuc.model.UniversiteConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UniversiteConfigurationRepository extends JpaRepository<UniversiteConfiguration, Long> {
    Optional<UniversiteConfiguration> findByUniversiteId(Long universiteId);
}
