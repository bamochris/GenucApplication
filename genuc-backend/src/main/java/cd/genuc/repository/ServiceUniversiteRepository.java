// cd.genuc.repository.ServiceUniversiteRepository.java
package cd.genuc.repository;

import cd.genuc.model.ServiceUniversite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceUniversiteRepository extends JpaRepository<ServiceUniversite, Long> {

    List<ServiceUniversite> findByUniversiteId(Long universiteId);

    List<ServiceUniversite> findByUniversiteIdAndActifTrue(Long universiteId);

    List<ServiceUniversite> findByUniversiteIdAndActifFalse(Long universiteId);

    Optional<ServiceUniversite> findByNomAndUniversiteId(String nom, Long universiteId);

    boolean existsByNomAndUniversiteId(String nom, Long universiteId);

    @Query("SELECT COUNT(s) FROM ServiceUniversite s WHERE s.universite.id = :universiteId AND s.actif = true")
    long countByUniversiteIdAndActifTrue(@Param("universiteId") Long universiteId);
}