package cd.genuc.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddEmailRequest {

    @NotBlank(message = "L'adresse email est obligatoire")
    @Email(message = "Format email invalide")
    private String email;
}