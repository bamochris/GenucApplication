package cd.genuc.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// ==========================================
// DTO : Connexion (Login)
// ==========================================
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    // Accepte un email OU un matricule etudiant (au Congo, beaucoup
    // d'etudiants n'ont pas d'adresse email : le matricule est leur
    // identifiant naturel). La resolution est faite dans AuthService.
    @NotBlank(message = "L'email ou le matricule est obligatoire")
    private String email;

    // ✅ SÉCURITÉ : Mot de passe minimum 8 caractères
    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String motDePasse;
}