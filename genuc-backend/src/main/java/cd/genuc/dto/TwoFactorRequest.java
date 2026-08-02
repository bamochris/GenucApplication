package cd.genuc.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorRequest {

    private String mfaChallengeToken;

    @NotBlank(message = "Le code de vérification est obligatoire")
    private String code;
}