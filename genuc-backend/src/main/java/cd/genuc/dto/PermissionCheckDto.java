package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

/**
 * PermissionCheckDto - Request DTO for permission checking
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionCheckDto {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Permission code is required")
    private String permissionCode;
}
