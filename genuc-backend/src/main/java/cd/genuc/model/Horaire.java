package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;
import java.time.DayOfWeek;

@Entity
@Table(name = "horaires")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Horaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    @ManyToOne
    @JoinColumn(name = "salle_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Salle salle;

    @Enumerated(EnumType.STRING)
    private DayOfWeek jour;

    private LocalTime heureDebut;
    private LocalTime heureFin;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TypeHoraire type = TypeHoraire.COURS;

    private String promotionLibelle;
    private Long universiteId;

    @Column(updatable = false)
    private java.time.LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = java.time.LocalDateTime.now();
    }

    public enum TypeHoraire {
        COURS, TD, TP, EXAMEN, REUNION, AUTRE
    }
}