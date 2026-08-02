package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Inscription d'un étudiant (inscription) à un événement de vie universitaire.
 */
@Entity
@Table(name = "evenement_participants",
       uniqueConstraints = @UniqueConstraint(columnNames = {"evenement_id", "inscription_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvenementParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evenement_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private EvenementUniversitaire evenement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @Column(updatable = false)
    private LocalDateTime dateInscription;

    @PrePersist
    protected void onCreate() {
        dateInscription = LocalDateTime.now();
    }
}
