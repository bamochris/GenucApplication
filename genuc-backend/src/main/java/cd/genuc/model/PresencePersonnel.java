package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "presences_personnel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresencePersonnel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "personnel_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Personnel personnel;

    @Column(nullable = false)
    private LocalDate datePresence;

    private LocalTime heureArrivee;
    private LocalTime heureDepart;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutPresence statut = StatutPresence.PRESENT;

    @Column(columnDefinition = "TEXT")
    private String motifAbsence;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (datePresence == null) datePresence = LocalDate.now();
    }

    public enum StatutPresence {
        PRESENT, ABSENT, RETARD, JUSTIFIE, CONGE
    }
}
