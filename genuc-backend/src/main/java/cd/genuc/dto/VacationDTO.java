package cd.genuc.dto;

import cd.genuc.model.TypeVacation;
import cd.genuc.model.Vacation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VacationDTO {
    private Long id;
    private String nom;
    private TypeVacation type;
    private String description;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private boolean inscriptionsOuvertes;
    private boolean actif;
    private Double fraisInscription;
    private String deviseFrais;
    private Integer capaciteMax;
    private Long universiteId;
    private String universiteNom;
    private Long anneeAcademiqueId;
    private String anneeAcademiqueLibelle;
    private int nbEtudiantsInscrits;
    private int nbCours;
    private List<CoursVacationDTO> coursVacations;
    private LocalDateTime creeLe;
    private LocalDateTime modifieLe;

    public static VacationDTO fromEntity(Vacation v) {
        VacationDTOBuilder builder = VacationDTO.builder()
                .id(v.getId())
                .nom(v.getNom())
                .type(v.getType())
                .description(v.getDescription())
                .dateDebut(v.getDateDebut())
                .dateFin(v.getDateFin())
                .inscriptionsOuvertes(v.isInscriptionsOuvertes())
                .actif(v.isActif())
                .fraisInscription(v.getFraisInscription())
                .deviseFrais(v.getDeviseFrais())
                .capaciteMax(v.getCapaciteMax())
                .nbEtudiantsInscrits(v.getNbEtudiantsInscrits())
                .creeLe(v.getCreeLe())
                .modifieLe(v.getModifieLe());

        if (v.getUniversite() != null) {
            builder.universiteId(v.getUniversite().getId());
            builder.universiteNom(v.getUniversite().getNom());
        }
        if (v.getAnneeAcademique() != null) {
            builder.anneeAcademiqueId(v.getAnneeAcademique().getId());
            builder.anneeAcademiqueLibelle(v.getAnneeAcademique().getLibelle());
        }
        if (v.getCoursVacations() != null) {
            builder.nbCours(v.getCoursVacations().size());
        }

        return builder.build();
    }
}
