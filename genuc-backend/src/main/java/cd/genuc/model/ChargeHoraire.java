package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "charges_horaires")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChargeHoraire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "personnel_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Personnel personnel;

    @ManyToOne
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    @Column(nullable = false)
    private Integer volumeHoraire;

    private String semestre;

    private Integer anneeAcademique;

    @ManyToOne
    @JoinColumn(name = "promotion_id")
    @JsonIgnore
    @ToString.Exclude
    private Promotion promotion;

    @Column(updatable = false)
    private java.time.LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = java.time.LocalDateTime.now();
        if (anneeAcademique == null) {
            anneeAcademique = java.time.LocalDate.now().getYear();
        }
    }
}