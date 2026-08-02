package cd.genuc.repository;

import cd.genuc.model.ParametresLMD;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParametresLMDRepository extends JpaRepository<ParametresLMD, Long> {
    Optional<ParametresLMD> findByUniversiteId(Long universiteId);
}