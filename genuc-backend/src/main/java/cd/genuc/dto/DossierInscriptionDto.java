package cd.genuc.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DossierInscriptionDto {

    private Long id;
    private String numeroDossier;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @Email(message = "Email invalide")
    @NotBlank(message = "L'email est obligatoire")
    private String email;

    private String telephone;

    // ✅ SÉCURITÉ : Mot de passe minimum 8 caractères
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String motDePasse;

    private String sexe;
    private String lieuNaissance;
    private LocalDate dateNaissance;
    private String adresse;

    @NotBlank(message = "Le niveau visé est obligatoire")
    private String niveauVise; // L1, L2, L3, M1, M2

    @NotNull(message = "L'université est obligatoire")
    private Long universiteId;

    @NotNull(message = "Le département est obligatoire")
    private Long departementId;

    @NotNull(message = "La filière est obligatoire")
    private Long filiereId;

    // Obligatoire si l'établissement a des vacations ouvertes aux inscriptions
    private Long vacationId;

    // URLs des documents (upload ultérieur)
    private String urlPhoto;
    private String urlActeNaissance;
    private String urlDiplomeEtat;

    // Statut du dossier (EN_ATTENTE, VALIDE, REJETE)
    private String statut;
    private String motifRejet;
    private String commentaireAdmin;
    private LocalDateTime creeLe;
}