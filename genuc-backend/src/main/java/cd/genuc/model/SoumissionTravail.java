package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "soumissions_travaux",
        uniqueConstraints = @UniqueConstraint(columnNames = {"travail_id", "inscription_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SoumissionTravail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travail_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private TravauxDevoir travail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @Column(nullable = false)
    private String fichierUrl;

    private String nomFichier;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    private LocalDateTime dateSoumission;

    private Double note;

    @Column(columnDefinition = "TEXT")
    private String commentaireCorrection;

    private String urlCorrection;
    private String nomFichierCorrection;

    private LocalDateTime dateCorrection;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutSoumission statut = StatutSoumission.SOUMIS;

    @PrePersist
    protected void onCreate() {
        if (dateSoumission == null) {
            dateSoumission = LocalDateTime.now();
        }
    }

    public enum StatutSoumission {
        SOUMIS, CORRIGE
    }
}
