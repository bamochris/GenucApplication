package cd.genuc.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Une ligne d'un {@link BaremeEvaluation} : une tranche de notes associée à une mention.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class BaremeLigne {

    private String mention;

    private Integer min;

    private Integer max;

    /** Grade lettré (A, B, C...). */
    private String points;

    @Column(columnDefinition = "TEXT")
    private String description;
}
