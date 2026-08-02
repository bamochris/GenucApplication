package cd.genuc.dto;

import cd.genuc.model.BourseOffre;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BourseOffreDto {
    private Long id;
    private String libelle;
    private BourseOffre.TypeBourseOffre type;
    private String description;
    private Double montant;
    private String devise;
    private Integer pourcentage;
    private Integer placesDisponibles;
    private Integer placesRestantes;
    private List<String> conditions;
    private LocalDate dateLimite;
    private Long universiteId;
    private boolean actif;

    public static BourseOffreDto fromEntity(BourseOffre b) {
        if (b == null) return null;
        return BourseOffreDto.builder()
                .id(b.getId())
                .libelle(b.getLibelle())
                .type(b.getType())
                .description(b.getDescription())
                .montant(b.getMontant())
                .devise(b.getDevise())
                .pourcentage(b.getPourcentage())
                .placesDisponibles(b.getPlacesDisponibles())
                .placesRestantes(b.getPlacesRestantes())
                .conditions(b.getConditions())
                .dateLimite(b.getDateLimite())
                .universiteId(b.getUniversite() != null ? b.getUniversite().getId() : null)
                .actif(b.isActif())
                .build();
    }
}
