// src/main/java/cd/genuc/dto/FraisDTO.java
package cd.genuc.dto;

import cd.genuc.model.Frais;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraisDTO {
    private Long id;
    private String code;
    private String libelle;
    private Double montant;
    private String devise;
    private Long categorieId;
    private String categorieDesignation;
    private String anneeAcademique;
    private Long promotionId;
    private String promotionLibelle;
    private Long faculteId;
    private String faculteNom;
    private LocalDate dateLimite;
    private String description;
    private String statut;
    private String type;
    private String universiteNom;
    private LocalDate creeLe;
}