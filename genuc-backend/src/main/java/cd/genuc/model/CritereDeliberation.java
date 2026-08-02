package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "criteres_deliberation")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CritereDeliberation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "promotion_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Promotion promotion;

    @ManyToOne
    @JoinColumn(name = "annee_academique_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private AnneeAcademique anneeAcademique;

    @Column(nullable = false)
    @Builder.Default
    private Double seuilMoyenne = 10.0;

    @Column(nullable = false)
    @Builder.Default
    private Double seuilCredits = 60.0;

    @Column(nullable = false)
    @Builder.Default
    private Double seuilRattrapage = 8.0;

    @Builder.Default
    private Double ponderationTP = 0.30;
    @Builder.Default
    private Double ponderationInterro = 0.20;
    @Builder.Default
    private Double ponderationExamen = 0.50;

    @Builder.Default
    private boolean actif = true;

    @Column(updatable = false)
    private java.time.LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = java.time.LocalDateTime.now();
    }
}