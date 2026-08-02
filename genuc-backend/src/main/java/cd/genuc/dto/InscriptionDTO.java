package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionDTO {
    private Long id;
    private String matricule;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String niveau;
    private String statut;          // EN_ATTENTE, VALIDEE, REJETEE
    private boolean bulletin;
    private boolean photo;
    private boolean acte;
    private boolean archive;
    private String commentaire;
    private String motifRejet;
    private LocalDateTime creeLe;

    // Relations (IDs + champs utiles)
    private Long etudiantId;
    private String etudiantNomComplet;

    private Long universiteId;
    private String universiteNom;

    private Long departementId;
    private String departementNom;

    private Long filiereId;
    private String filiereNom;

    private Long promotionId;
    private String promotionLibelle;

    private Long anneeAcademiqueId;
    private String anneeAcademiqueLibelle;
}