package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "stages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Stage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @Column(nullable = false)
    private String entreprise;

    @Column(columnDefinition = "TEXT")
    private String adresse;

    private String telephone;
    private String responsable;
    private String emailResponsable;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = false)
    private LocalDate dateFin;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String conventionUrl;
    private String conventionNomFichier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutStage statut = StatutStage.EN_ATTENTE;

    private String motifRejet;

    private Long tuteurId;
    private String tuteurNom;

    @Builder.Default
    private Integer progression = 0;

    private String rapportUrl;
    private String rapportNomFichier;
    private String rapportTitre;

    @Column(columnDefinition = "TEXT")
    private String rapportResume;

    private LocalDateTime rapportDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutRapport rapportStatut = StatutRapport.AUCUN;

    @Column(columnDefinition = "TEXT")
    private String avis;

    private LocalDateTime avisDate;

    private Long valideParId;

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    public Integer getDureeSemaines() {
        if (dateDebut == null || dateFin == null) return null;
        long jours = ChronoUnit.DAYS.between(dateDebut, dateFin);
        return (int) Math.max(1, Math.round(jours / 7.0));
    }

    public enum StatutStage {
        EN_ATTENTE, VALIDE, EN_COURS, TERMINE, REJETE, SUSPENDU
    }

    public enum StatutRapport {
        AUCUN, EN_ATTENTE, VALIDE
    }
}
