package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bourses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "dossier_social_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private DossierSocial dossierSocial;

    @Column(unique = true, nullable = false)
    private String numeroBourse;

    @Enumerated(EnumType.STRING)
    private TypeBourse type;

    private Double montantTotal;
    private Double montantParMois;
    private Integer dureeMois;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutBourse statut = StatutBourse.ACTIVE;

    @Column(columnDefinition = "TEXT")
    private String conditions;

    private String typePaiement;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (numeroBourse == null) {
            numeroBourse = genererNumeroBourse();
        }
        if (dateDebut == null) dateDebut = LocalDate.now();
        if (dureeMois != null && dateFin == null) {
            dateFin = dateDebut.plusMonths(dureeMois);
        }
    }

    private String genererNumeroBourse() {
        int annee = LocalDate.now().getYear();
        return String.format("BOU-%d-%06d", annee, System.currentTimeMillis() % 1000000);
    }

    public enum TypeBourse {
        EXCELLENCE, SOCIALE, SPORTIVE, CULTURELLE, MERITE
    }

    public enum StatutBourse {
        ACTIVE, SUSPENDUE, TERMINEE
    }
}