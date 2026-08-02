// cd.genuc.dto.UniversiteDTO
package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO pour l'entité Université (optimisé pour les vues publiques)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UniversiteDTO {
    
    private Long id;
    private String nom;
    private String code;
    private String ville;
    private String adresse;
    private String telephone;
    private String email;
    private String siteWeb;
    private String logo;
    private String description;
    private boolean inscriptionsOuvertes;
    private Double fraisBase;
    private boolean actif;
    private Integer anneeFondation;
    
    // Pour la vue publique, on peut inclure des statistiques
    private Integer nbDepartements;
    private Integer nbEtudiants;
    private Integer nbCours;
    
    // Liste simplifiée des départements (optionnel)
    private List<DepartementSimpleDTO> departements;
    
    /**
     * DTO simplifié pour les départements
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartementSimpleDTO {
        private Long id;
        private String nom;
        private String code;
        private String type;
    }
}