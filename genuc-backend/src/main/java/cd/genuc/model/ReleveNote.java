package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.PrePersist;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "releves_notes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReleveNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numeroReleve;

    @ManyToOne
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @Column(nullable = false)
    private String anneeAcademique;

    private Double moyenneGenerale;
    private Double moyenneArithmetique;
    private Double moyennePonderee;

    private Integer creditsAcquis;
    private Integer creditsTotaux;
    private Integer creditsManquants;

    private Integer nbCoursReussis;
    private Integer nbCoursEchoues;
    private Integer nbCoursTotal;

    @Enumerated(EnumType.STRING)
    private Mention mention;

    @Enumerated(EnumType.STRING)
    private Decision decision;

    private LocalDateTime dateGeneration;

    @Column(columnDefinition = "TEXT")
    private String appreciationGenerale;

    private String signataireNom;
    private String signataireTitre;

    private String uuidVerification;
    @Builder.Default
    private boolean publie = false;

    @PrePersist
    protected void onCreate() {
        dateGeneration = LocalDateTime.now();
        numeroReleve = "REL-" + System.currentTimeMillis();
        uuidVerification = java.util.UUID.randomUUID().toString();
    }

    public enum Mention {
        AJOURNE, REUSSITE, SATISFACTION, DISTINCTION, GRANDE_DISTINCTION, TRES_GRANDE_DISTINCTION
    }

    public enum Decision {
        AJOURNE, ADMIS, ADMIS_RATTRAPAGE, REDOUBLE, DIPLOME
    }
}