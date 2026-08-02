package cd.genuc.dto;

import cd.genuc.model.InscriptionVacation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionVacationDTO {
    private Long id;
    private String statut;
    private String commentaire;
    private Long vacationId;
    private String vacationNom;
    private String vacationType;
    private Long etudiantId;
    private String etudiantNom;
    private String etudiantPrenom;
    private String etudiantMatricule;
    private Long inscriptionId;
    private Long promotionId;
    private String promotionNom;
    private Long anneeAcademiqueId;
    private LocalDateTime creeLe;
    private LocalDateTime modifieLe;

    public static InscriptionVacationDTO fromEntity(InscriptionVacation iv) {
        InscriptionVacationDTOBuilder builder = InscriptionVacationDTO.builder()
                .id(iv.getId())
                .statut(iv.getStatut().name())
                .commentaire(iv.getCommentaire())
                .creeLe(iv.getCreeLe())
                .modifieLe(iv.getModifieLe());

        if (iv.getVacation() != null) {
            builder.vacationId(iv.getVacation().getId());
            builder.vacationNom(iv.getVacation().getNom());
            builder.vacationType(iv.getVacation().getType().name());
        }
        if (iv.getEtudiant() != null) {
            builder.etudiantId(iv.getEtudiant().getId());
            builder.etudiantNom(iv.getEtudiant().getNom());
            builder.etudiantPrenom(iv.getEtudiant().getPrenom());
            builder.etudiantMatricule(iv.getEtudiant().getMatriculePermanent());
        }
        if (iv.getPromotion() != null) {
            builder.promotionId(iv.getPromotion().getId());
            builder.promotionNom(iv.getPromotion().getLibelle());
        }
        if (iv.getAnneeAcademique() != null) {
            builder.anneeAcademiqueId(iv.getAnneeAcademique().getId());
        }

        return builder.build();
    }
}
