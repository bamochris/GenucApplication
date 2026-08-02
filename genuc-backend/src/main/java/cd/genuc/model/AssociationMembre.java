package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Adhésion d'un étudiant (inscription) à un club / association.
 */
@Entity
@Table(name = "association_membres",
       uniqueConstraints = @UniqueConstraint(columnNames = {"association_id", "inscription_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssociationMembre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "association_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Association association;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @Column(updatable = false)
    private LocalDateTime dateAdhesion;

    @PrePersist
    protected void onCreate() {
        dateAdhesion = LocalDateTime.now();
    }
}
