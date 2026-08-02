package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "examens")
public class Examen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false)
    private LocalDate date;

    private LocalTime heureDebut;
    private LocalTime heureFin;

    @Builder.Default
    private Integer dureeMinutes = 120;

    /** Coefficient de pondération de cette évaluation (utilisé par le module Évaluations du professeur). */
    @Builder.Default
    private Double coefficient = 1.0;

    /** Nombre de questions — renseigné pour les interrogations (type INTERROGATION). */
    private Integer nbQuestions;

    /** Nombre de groupes — renseigné pour les travaux pratiques/dirigés (type TP_TD). */
    private Integer nbGroupes;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TypeExamen type = TypeExamen.EXAMEN_SESSION;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutExamen statut = StatutExamen.PLANIFIE;

    private String salle;
    private Integer capaciteSalle;

    @Builder.Default
    private Integer nbInscrits = 0;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    private String anneeAcademique;

    @Builder.Default
    private Integer session = 1;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() { creeLe = LocalDateTime.now(); }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

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

    private Long professeurId;
    private String professeurNom;

    public enum TypeExamen {
        INTERROGATION, EXAMEN_SESSION, RATTRAPAGE, EXAMEN_DIPLO, TP_TD
    }

    public enum StatutExamen {
        PLANIFIE, EN_COURS, TERMINE, ANNULE
    }
}
