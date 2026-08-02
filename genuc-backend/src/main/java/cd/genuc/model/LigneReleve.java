package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lignes_releve")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LigneReleve {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "releve_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private ReleveNote releve;

    @ManyToOne
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    private Double noteTP;
    private Double noteInterrogation;
    private Double noteExamen;
    private Double noteFinale;
    private Double noteRattrapage;
    private Double noteRetenue;

    private Integer credits;
    private Integer session;

    @Enumerated(EnumType.STRING)
    private Note.MentionNote mention;

    @Builder.Default
    private boolean reussi = false;

    private Integer rangClasse;
    private Integer totalClasse;
}