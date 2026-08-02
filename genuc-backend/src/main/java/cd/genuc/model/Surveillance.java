package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "surveillances")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Surveillance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "examen_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Examen examen;

    @ManyToOne
    @JoinColumn(name = "surveillant_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Personnel surveillant;

    @ManyToOne
    @JoinColumn(name = "salle_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Salle salle;

    private LocalDate dateSurveillance;

    private String heureDebut;
    private String heureFin;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (dateSurveillance == null) dateSurveillance = LocalDate.now();
    }
}