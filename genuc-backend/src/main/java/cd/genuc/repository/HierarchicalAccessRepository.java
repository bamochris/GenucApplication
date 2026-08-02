package cd.genuc.repository;

import cd.genuc.model.HierarchicalAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HierarchicalAccessRepository extends JpaRepository<HierarchicalAccess, Long> {
    Optional<HierarchicalAccess> findByUserIdAndUniversiteIdAndDepartementId(Long userId, Long universiteId, Long departementId);
    
    List<HierarchicalAccess> findByUserId(Long userId);
    
    List<HierarchicalAccess> findByUniversiteId(Long universiteId);
    
    List<HierarchicalAccess> findByDepartementId(Long departementId);
    
    @Query("SELECT ha FROM HierarchicalAccess ha WHERE ha.user.id = :userId AND ha.universite.id = :universiteId")
    Optional<HierarchicalAccess> findByUserAndUniversity(@Param("userId") Long userId, @Param("universiteId") Long universiteId);
    
    @Query("SELECT ha FROM HierarchicalAccess ha WHERE ha.user.id = :userId AND ha.departement.id = :departementId")
    Optional<HierarchicalAccess> findByUserAndDepartment(@Param("userId") Long userId, @Param("departementId") Long departementId);
}
