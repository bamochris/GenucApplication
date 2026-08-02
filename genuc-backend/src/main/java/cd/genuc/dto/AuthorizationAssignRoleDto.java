package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;

/**
 * AuthorizationAssignRoleDto - Request DTO for role assignment
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorizationAssignRoleDto {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Role ID is required")
    private Long roleId;

    @NotNull(message = "University ID is required")
    private Long universiteId;

    @NotNull(message = "Assigned by user ID is required")
    private Long assignedBy;
}
