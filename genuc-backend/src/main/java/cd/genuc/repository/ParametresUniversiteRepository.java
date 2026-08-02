package cd.genuc.repository;

import cd.genuc.model.ParametresUniversite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ParametresUniversiteRepository extends JpaRepository<ParametresUniversite, Long> {

    Optional<ParametresUniversite> findByUniversiteId(Long universiteId);
}