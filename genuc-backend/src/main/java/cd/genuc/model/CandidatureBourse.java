package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * CandidatureBourse - Candidature soumise par un étudiant pour une {@link BourseOffre}.
 */
@Entity
@Table(name = "candidatures_bourse")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidatureBourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "bourse_offre_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private BourseOffre bourseOffre;

    @ManyToOne
    @JoinColumn(name = "etudiant_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Etudiant etudiant;

    @Column(columnDefinition = "TEXT")
    private String motivation;

    private String pieceJustificativeUrl;

    @Column(nullable = false)
    private LocalDate dateDemande;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutCandidature statut = StatutCandidature.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String motifRejet;

    private LocalDateTime dateDecision;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (dateDemande == null) dateDemande = LocalDate.now();
    }

    public enum StatutCandidature {
        EN_ATTENTE, APPROUVEE, REJETEE
    }
}
