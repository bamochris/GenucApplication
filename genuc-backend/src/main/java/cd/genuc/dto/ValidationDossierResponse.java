// cd/genuc/dto/ValidationDossierResponse.java
package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidationDossierResponse {
    private String message;
    private String matricule;
    private String email;
    private String motDePasse;
    private Long utilisateurId;
    private Long inscriptionId;
}