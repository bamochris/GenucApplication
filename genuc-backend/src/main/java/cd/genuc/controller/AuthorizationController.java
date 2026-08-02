package cd.genuc.controller;

import cd.genuc.dto.AuthorizationAssignRoleDto;
import cd.genuc.dto.PermissionCheckDto;
import cd.genuc.model.Role;
import cd.genuc.model.UserRole;
import cd.genuc.service.AuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * AuthorizationController - REST API pour la gestion des droits d'accès RBAC
 */
@RestController
@RequestMapping("/api/v1/authorization")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authorization", description = "RBAC authorization API")
public class AuthorizationController {
    private final AuthorizationService authorizationService;

    /**
     * Check if user has permission
     * POST /api/v1/authorization/check-permission
     */
    @PostMapping("/check-permission")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'UNIVERSITY_ADMIN')")
    @Operation(summary = "Check if user has permission")
    public ResponseEntity<Map<String, Object>> checkPermission(
            @Valid @RequestBody PermissionCheckDto request) {
        log.info("Checking permission: user={}, permission={}", request.getUserId(), request.getPermissionCode());

        boolean hasPermission = authorizationService.hasPermission(
                request.getUserId(),
                request.getPermissionCode()
        );

        return ResponseEntity.ok(Map.of(
                "user_id", request.getUserId(),
                "permission", request.getPermissionCode(),
                "has_permission", hasPermission
        ));
    }

    /**
     * Get user permissions
     * GET /api/v1/authorization/user/{userId}/permissions
     */
    @GetMapping("/user/{userId}/permissions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'UNIVERSITY_ADMIN') or @authorizationService.hasPermission(#userId, 'VIEW_OWN_PERMISSIONS')")
    @Operation(summary = "Get user permissions")
    public ResponseEntity<Set<String>> getUserPermissions(@PathVariable Long userId) {
        log.info("Fetching permissions for user: {}", userId);
        return ResponseEntity.ok(authorizationService.getUserPermissions(userId));
    }

    /**
     * Get user roles
     * GET /api/v1/authorization/user/{userId}/roles/{universiteId}
     */
    @GetMapping("/user/{userId}/roles/{universiteId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'UNIVERSITY_ADMIN')")
    @Operation(summary = "Get user roles")
    public ResponseEntity<List<Role>> getUserRoles(
            @PathVariable Long userId,
            @PathVariable Long universiteId) {
        log.info("Fetching roles for user: {}, universite: {}", userId, universiteId);
        return ResponseEntity.ok(authorizationService.getUserRoles(userId, universiteId));
    }

    /**
     * Assign role to user
     * POST /api/v1/authorization/assign-role
     */
    @PostMapping("/assign-role")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'UNIVERSITY_ADMIN')")
    @Operation(summary = "Assign role to user")
    public ResponseEntity<Map<String, Object>> assignRoleToUser(
            @Valid @RequestBody AuthorizationAssignRoleDto request) {
        log.info("Assigning role: user={}, role={}, universite={}", request.getUserId(), request.getRoleId(), request.getUniversiteId());

        UserRole userRole = authorizationService.assignRoleToUser(
                request.getUserId(),
                request.getRoleId(),
                request.getUniversiteId(),
                request.getAssignedBy()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "user_id", userRole.getUser().getId(),
                        "role_id", userRole.getRole().getId(),
                        "universite_id", userRole.getUniversite().getId(),
                        "assigned_at", userRole.getAssignedAt()
                ));
    }

    /**
     * Revoke role from user
     * DELETE /api/v1/authorization/revoke-role
     */
    @DeleteMapping("/revoke-role")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'UNIVERSITY_ADMIN')")
    @Operation(summary = "Revoke role from user")
    public ResponseEntity<Map<String, Object>> revokeRoleFromUser(
            @RequestParam Long userId,
            @RequestParam Long roleId,
            @RequestParam Long universiteId,
            @RequestParam Long revokedBy) {
        log.info("Revoking role: user={}, role={}, universite={}", userId, roleId, universiteId);

        authorizationService.revokeRoleFromUser(userId, roleId, universiteId, revokedBy);

        return ResponseEntity.ok(Map.of(
                "message", "Role revoked successfully",
                "user_id", userId
        ));
    }
}
