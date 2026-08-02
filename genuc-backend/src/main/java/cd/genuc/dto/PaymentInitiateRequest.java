package cd.genuc.dto;

import cd.genuc.model.PaymentMethodEnum;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentInitiateRequest {

    @NotNull(message = "L'ID de l'étudiant est obligatoire")
    private Long etudiantId;

    @NotNull(message = "L'ID de l'université est obligatoire")
    private Long universiteId;

    @NotNull(message = "Le montant est obligatoire")
    @Positive(message = "Le montant doit être supérieur à zéro")
    private BigDecimal montantFC;

    @NotNull(message = "La méthode de paiement est obligatoire")
    private PaymentMethodEnum method;

    private String description;

    // Getters et setters (Lombok @Data les génère)
}