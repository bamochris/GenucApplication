package cd.genuc.repository;

import cd.genuc.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByCode(String code);
    
    List<Permission> findByModule(String module);
    
    List<Permission> findByResourceType(String resourceType);
    
    List<Permission> findByModuleAndResourceType(String module, String resourceType);
    
    @Query("SELECT p FROM Permission p WHERE p.module = :module AND p.action = :action")
    List<Permission> findByModuleAndAction(@Param("module") String module, @Param("action") String action);
    
    @Query("SELECT p FROM Permission p WHERE p.code IN :codes")
    Set<Permission> findByCodes(@Param("codes") Set<String> codes);
}
