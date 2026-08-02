package cd.genuc.repository;

import cd.genuc.model.Faculte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FaculteRepository extends JpaRepository<Faculte, Long> {

    List<Faculte> findByUniversiteId(Long universiteId);

    Optional<Faculte> findByCode(String code);

    boolean existsByCodeAndUniversiteId(String code, Long universiteId);
}
