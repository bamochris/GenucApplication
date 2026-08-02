package cd.genuc.dto;

import cd.genuc.model.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// ==========================================
// DTO : Réponse Auth (Token JWT + infos user)
// ==========================================
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private Long id;
    private String nomComplet;
    private String email;
    private RoleEnum role;
    private Long universiteId;
    private Long departementId;

    // Constructeur personnalisé sans 'type' (valeur par défaut "Bearer")
    public AuthResponse(String token, Long id, String nomComplet,
                        String email, RoleEnum role,
                        Long universiteId, Long departementId) {
        this.token        = token;
        this.type         = "Bearer";
        this.id           = id;
        this.nomComplet   = nomComplet;
        this.email        = email;
        this.role         = role;
        this.universiteId = universiteId;
        this.departementId = departementId;
    }
}
