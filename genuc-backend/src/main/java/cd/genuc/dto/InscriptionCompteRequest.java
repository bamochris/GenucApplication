package cd.genuc.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Corps de requête de <b>création de compte</b> ({@code POST /api/auth/inscrire}).
 *
 * <p>Remplace l'ancien {@code Map<String, Object>} : les champs et la validation
 * reflètent exactement le contrat envoyé par le frontend (AuthContext.register).
 * La validation est volontairement ADDITIVE (aucun rejet nouveau par rapport à
 * l'ancien comportement) : mot de passe min. 6 = même règle que la validation
 * cliente. Les règles métier (universiteId/departementId requis selon le rôle,
 * email déjà utilisé) restent gérées par {@code AuthService.inscrire}.</p>
 */
@Data
public class InscriptionCompteRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 100, message = "Le prénom ne peut pas dépasser 100 caractères")
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String motDePasse;

    /** Rôle demandé (valeur de {@code RoleEnum}) — la conversion/validation fine est faite par le service. */
    @NotBlank(message = "Le rôle est obligatoire")
    private String role;

    // ─── Optionnels ───────────────────────────────────────────────
    private String telephone;
    private Long universiteId;
    private Long departementId;
}
