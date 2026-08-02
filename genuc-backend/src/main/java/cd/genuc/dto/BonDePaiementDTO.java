package cd.genuc.dto;

import cd.genuc.model.BonDePaiement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 🧾 DTO pour Bon de Paiement avec QR Code
 * Coordonnées bancaires + Mobile Money (M-Pesa, Orange Money, Airtel Money)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BonDePaiementDTO {
    private Long id;
    private String numero;
    private Double montant;
    private LocalDate dateEmission;
    private LocalDate dateExpiration;
    private boolean utilise;
    private boolean expire;
    private String codeQR;
    private String contenuTexte;
    private String observations;

    private Long inscriptionId;
    private String etudiantNom;
    private String etudiantPrenom;
    private String etudiantMatricule;
    private String filiereNom;
    private String promotionNom;

    private LocalDateTime creeLe;

    public static BonDePaiementDTO fromEntity(BonDePaiement bon) {
        BonDePaiementDTOBuilder builder = BonDePaiementDTO.builder()
                .id(bon.getId())
                .numero(bon.getNumero())
                .montant(bon.getMontant())
                .dateEmission(bon.getDateEmission())
                .dateExpiration(bon.getDateExpiration())
                .utilise(bon.isUtilise())
                .expire(bon.estExpire())
                .codeQR(bon.getCodeQR())
                .contenuTexte(bon.getContenuTexte())
                .observations(bon.getObservations())
                .creeLe(bon.getCreeLe());

        if (bon.getInscription() != null) {
            builder.inscriptionId(bon.getInscription().getId());
            builder.etudiantNom(bon.getInscription().getNom());
            builder.etudiantPrenom(bon.getInscription().getPrenom());
            builder.etudiantMatricule(bon.getInscription().getMatricule());
            if (bon.getInscription().getFiliere() != null) {
                builder.filiereNom(bon.getInscription().getFiliere().getNom());
            }
            if (bon.getInscription().getPromotion() != null) {
                builder.promotionNom(bon.getInscription().getPromotion().getLibelle());
            }
        }

        return builder.build();
    }
}
