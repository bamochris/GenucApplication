package cd.genuc.repository;

import cd.genuc.model.CompteComptable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompteComptableRepository extends JpaRepository<CompteComptable, Long> {

    Optional<CompteComptable> findByCodeAndUniversiteId(String code, Long universiteId);

    List<CompteComptable> findByUniversiteId(Long universiteId);

    List<CompteComptable> findByUniversiteIdAndActifTrue(Long universiteId);
}