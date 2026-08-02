// src/main/java/cd/genuc/dto/AffectationFraisDTO.java
package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AffectationFraisDTO {
    private Long id;
    private Long fraisId;
    private String fraisCode;
    private String fraisLibelle;
    private Double montant;
    private Double reste;
    private String statut;
    private String dateEcheance;
    private String commentaire;
    private String paiementReference;
    private String inscriptionMatricule;
    private String etudiantNom;
    private Long promotionId;
    private String promotionLibelle;
}
