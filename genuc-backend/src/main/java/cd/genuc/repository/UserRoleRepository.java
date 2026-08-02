package cd.genuc.repository;

import cd.genuc.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    List<UserRole> findByUserId(Long userId);
    
    List<UserRole> findByUserIdAndUniversiteId(Long userId, Long universiteId);
    
    List<UserRole> findByRoleId(Long roleId);
    
    List<UserRole> findByUniversiteId(Long universiteId);
    
    @Query("SELECT ur FROM UserRole ur WHERE ur.user.id = :userId AND ur.universite.id = :universiteId AND ur.isActive = true")
    List<UserRole> findActiveRolesByUserAndUniversity(@Param("userId") Long userId, @Param("universiteId") Long universiteId);
    
    @Query("SELECT ur FROM UserRole ur WHERE ur.user.id = :userId AND ur.isActive = true")
    List<UserRole> findActiveRolesByUser(@Param("userId") Long userId);
    
    Optional<UserRole> findByUserIdAndRoleIdAndUniversiteId(Long userId, Long roleId, Long universiteId);
}
