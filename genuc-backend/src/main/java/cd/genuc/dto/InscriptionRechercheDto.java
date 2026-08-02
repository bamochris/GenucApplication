package cd.genuc.dto;

import cd.genuc.model.Inscription;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * InscriptionRechercheDto - Résultat léger pour la recherche floue d'étudiants
 * (caisse / affectation de frais) : matricule, identité et filière/promotion,
 * sans exposer l'entité JPA complète.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InscriptionRechercheDto {
    private Long id;
    private String matricule;
    private String nom;
    private String prenom;
    private String email;
    private String filiere;
    private String promotion;

    public static InscriptionRechercheDto fromEntity(Inscription i) {
        if (i == null) return null;
        return InscriptionRechercheDto.builder()
                .id(i.getId())
                .matricule(i.getMatricule())
                .nom(i.getNom())
                .prenom(i.getPrenom())
                .email(i.getEmail())
                .filiere(i.getFiliere() != null ? i.getFiliere().getNom() : null)
                .promotion(i.getPromotion() != null ? i.getPromotion().getLibelle() : null)
                .build();
    }
}
