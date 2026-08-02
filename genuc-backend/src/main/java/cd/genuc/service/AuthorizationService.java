package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AuthorizationService - Gestion des droits d'accès RBAC
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthorizationService {
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final HierarchicalAccessRepository hierarchicalAccessRepository;
    private final PermissionRepository permissionRepository;
    private final SecurityEventRepository securityEventRepository;

    /**
     * Check if user has permission
     */
    public boolean hasPermission(Long userId, String permissionCode) {
        log.debug("Checking permission: user={}, permission={}", userId, permissionCode);

        List<UserRole> userRoles = userRoleRepository.findActiveRolesByUser(userId);

        return userRoles.stream()
                .flatMap(ur -> ur.getRole().getPermissions().stream())
                .map(RolePermission::getPermission)
                .map(Permission::getCode)
                .anyMatch(permissionCode::equals);
    }

    /**
     * Check if user can access resource at university
     */
    public boolean canAccessUniversity(Long userId, Long universiteId) {
        List<UserRole> userRoles = userRoleRepository.findActiveRolesByUserAndUniversity(userId, universiteId);
        return !userRoles.isEmpty();
    }

    /**
     * Check if user can access department
     */
    public boolean canAccessDepartment(Long userId, Long departmentId) {
        Optional<HierarchicalAccess> access = hierarchicalAccessRepository.findByUserAndDepartment(userId, departmentId);
        return access.isPresent();
    }

    /**
     * Assign role to user
     */
    public UserRole assignRoleToUser(Long userId, Long roleId, Long universiteId, Long assignedBy) {
        log.info("Assigning role to user: user={}, role={}, universite={}", userId, roleId, universiteId);

        UserRole userRole = UserRole.builder()
                .user(Utilisateur.builder().id(userId).build())
                .role(Role.builder().id(roleId).build())
                .universite(Universite.builder().id(universiteId).build())
                .assignedBy(Utilisateur.builder().id(assignedBy).build())
                .isActive(true)
                .assignedAt(LocalDateTime.now())
                .build();

        UserRole saved = userRoleRepository.save(userRole);

        // Log security event
        logSecurityEvent(assignedBy, universiteId, "ROLE_ASSIGNED", 
                String.format("Role %d assigned to user %d", roleId, userId), "SUCCESS");

        return saved;
    }

    /**
     * Revoke role from user
     */
    public void revokeRoleFromUser(Long userId, Long roleId, Long universiteId, Long revokedBy) {
        log.info("Revoking role from user: user={}, role={}, universite={}", userId, roleId, universiteId);

        Optional<UserRole> userRole = userRoleRepository.findByUserIdAndRoleIdAndUniversiteId(userId, roleId, universiteId);
        if (userRole.isPresent()) {
            userRoleRepository.delete(userRole.get());
            logSecurityEvent(revokedBy, universiteId, "ROLE_REVOKED",
                    String.format("Role %d revoked from user %d", roleId, userId), "SUCCESS");
        }
    }

    /**
     * Get user permissions
     */
    public Set<String> getUserPermissions(Long userId) {
        List<UserRole> userRoles = userRoleRepository.findActiveRolesByUser(userId);

        return userRoles.stream()
                .flatMap(ur -> ur.getRole().getPermissions().stream())
                .map(RolePermission::getPermission)
                .map(Permission::getCode)
                .collect(Collectors.toSet());
    }

    /**
     * Get user roles
     */
    public List<Role> getUserRoles(Long userId, Long universiteId) {
        return userRoleRepository.findActiveRolesByUserAndUniversity(userId, universiteId)
                .stream()
                .map(UserRole::getRole)
                .collect(Collectors.toList());
    }

    /**
     * Log security event
     */
    private void logSecurityEvent(Long userId, Long universiteId, String eventType, String description, String status) {
        SecurityEvent event = SecurityEvent.builder()
                .user(Utilisateur.builder().id(userId).build())
                .universite(Universite.builder().id(universiteId).build())
                .eventType(eventType)
                .description(description)
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();

        securityEventRepository.save(event);
    }
}
