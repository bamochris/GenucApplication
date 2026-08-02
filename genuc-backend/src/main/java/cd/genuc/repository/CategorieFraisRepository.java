// src/main/java/cd/genuc/repository/CategorieFraisRepository.java
package cd.genuc.repository;

import cd.genuc.model.CategorieFrais;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategorieFraisRepository extends JpaRepository<CategorieFrais, Long> {

    List<CategorieFrais> findByUniversiteId(Long universiteId);

    List<CategorieFrais> findByUniversiteIdAndActifTrue(Long universiteId);

    Optional<CategorieFrais> findByCodeAndUniversiteId(String code, Long universiteId);

    boolean existsByCodeAndUniversiteId(String code, Long universiteId);
}