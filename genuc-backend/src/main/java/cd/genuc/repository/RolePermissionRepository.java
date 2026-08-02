package cd.genuc.repository;

import cd.genuc.model.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRoleId(Long roleId);
    
    Set<RolePermission> findByPermissionId(Long permissionId);
    
    @Query("SELECT rp FROM RolePermission rp WHERE rp.role.id = :roleId")
    List<RolePermission> findPermissionsByRole(@Param("roleId") Long roleId);
    
    @Query("SELECT rp.permission FROM RolePermission rp WHERE rp.role.id = :roleId")
    Set<Object> findPermissionsCodesByRole(@Param("roleId") Long roleId);
}
