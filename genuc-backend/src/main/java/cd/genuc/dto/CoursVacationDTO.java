package cd.genuc.dto;

import cd.genuc.model.CoursVacation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoursVacationDTO {
    private Long id;
    private String jour;
    private String heureDebut;
    private String heureFin;
    private String salle;
    private boolean actif;
    private Long vacationId;
    private String vacationNom;
    private Long coursId;
    private String coursTitre;
    private String coursCode;
    private Long professeurId;
    private String professeurNom;
    private String professeurPrenom;
    private Long promotionId;
    private String promotionNom;

    public static CoursVacationDTO fromEntity(CoursVacation cv) {
        CoursVacationDTOBuilder builder = CoursVacationDTO.builder()
                .id(cv.getId())
                .jour(cv.getJour())
                .heureDebut(cv.getHeureDebut())
                .heureFin(cv.getHeureFin())
                .salle(cv.getSalle())
                .actif(cv.isActif());

        if (cv.getVacation() != null) {
            builder.vacationId(cv.getVacation().getId());
            builder.vacationNom(cv.getVacation().getNom());
        }
        if (cv.getCours() != null) {
            builder.coursId(cv.getCours().getId());
            builder.coursTitre(cv.getCours().getTitre());
            builder.coursCode(cv.getCours().getCode());
        }
        if (cv.getProfesseur() != null) {
            builder.professeurId(cv.getProfesseur().getId());
            builder.professeurNom(cv.getProfesseur().getNom());
            builder.professeurPrenom(cv.getProfesseur().getPrenom());
        }
        if (cv.getPromotion() != null) {
            builder.promotionId(cv.getPromotion().getId());
            builder.promotionNom(cv.getPromotion().getLibelle());
        }

        return builder.build();
    }
}
