package cd.genuc.repository;

import cd.genuc.model.Role;
import cd.genuc.model.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleEnum name);
    
    List<Role> findByUniversiteId(Long universiteId);
    
    List<Role> findByUniversiteIdAndIsActiveTrue(Long universiteId);
    
    @Query("SELECT r FROM Role r WHERE r.isSystemRole = true AND r.isActive = true")
    List<Role> findAllSystemRoles();
    
    @Query("SELECT r FROM Role r WHERE r.universite.id = :universiteId AND r.isActive = true")
    List<Role> findActiveRolesByUniversity(@Param("universiteId") Long universiteId);
}
