package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "candidatures_stage",
        uniqueConstraints = @UniqueConstraint(columnNames = {"offre_id", "inscription_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidatureStage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offre_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private OffreStage offre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @Column(updatable = false)
    private LocalDateTime dateCandidature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutCandidature statut = StatutCandidature.EN_ATTENTE;

    @PrePersist
    protected void onCreate() {
        dateCandidature = LocalDateTime.now();
    }

    public enum StatutCandidature {
        EN_ATTENTE, ACCEPTEE, REFUSEE
    }
}
