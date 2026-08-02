package cd.genuc.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InscriptionRequest {
    
    @NotNull(message = "L'ID de l'université est obligatoire")
    private Long universiteId;
    
    @NotNull(message = "L'ID du département est obligatoire")
    private Long departementId;
    
    @NotNull(message = "L'ID de l'étudiant est obligatoire")
    private Long etudiantId;
    
    @NotNull(message = "L'ID de la filière est obligatoire")
    private Long filiereId;
    
    @NotNull(message = "L'ID de la promotion est obligatoire")
    private Long promotionId;
    
    @NotNull(message = "L'ID de l'année académique est obligatoire")
    private Long anneeAcademiqueId;
    
    private String commentaire;
}