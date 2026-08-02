package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "deliberations",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"inscription_id", "annee_academique"}
       ))
public class Deliberation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String anneeAcademique;

    private String niveau;

    private Double moyenneGenerale;

    @Builder.Default
    private Integer creditsValides = 0;

    @Builder.Default
    private Integer creditsRequis = 60;

    @Builder.Default
    private Integer coursReussis = 0;

    @Builder.Default
    private Integer coursTotaux = 0;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DecisionJury decision = DecisionJury.EN_ATTENTE;

    @Enumerated(EnumType.STRING)
    private Note.MentionNote mention;

    private String niveauSuivant;

    @Column(columnDefinition = "TEXT")
    private String commentaireJury;

    @Column(unique = true)
    private String codeDiplome;

    @Column(unique = true)
    private String uuidVerification;

    @Builder.Default
    private boolean diplomeGenere = false;
    private LocalDate dateDiplome;

    private LocalDate dateDeliberation;
    private Long presidentJuryId;
    private String presidentJuryNom;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private StatutDeliberation statut = StatutDeliberation.EN_PREPARATION;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private PhaseDeliberation phase = PhaseDeliberation.PREPARATION;

    @Builder.Default
    private boolean publiee = false;
    private LocalDate datePublication;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (uuidVerification == null) {
            uuidVerification = java.util.UUID.randomUUID().toString();
        }
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departement_id")
    @JsonIgnore
    @ToString.Exclude
    private Departement departement;

    public enum DecisionJury {
        EN_ATTENTE, ADMIS, ADMIS_RATTRAPAGE, REDOUBLE, EXCLU, DIPLOME
    }

    public enum StatutDeliberation {
        EN_PREPARATION, PRÊTE, TENUE, PUBLIEE
    }

    public enum PhaseDeliberation {
        PREPARATION, PREMIERE, RATTRAPAGE, PUBLIEE, CLOTUREE
    }

    public void setPubilee(boolean b) {
        this.publiee = b;
    }
}