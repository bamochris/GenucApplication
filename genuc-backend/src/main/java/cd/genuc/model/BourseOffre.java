package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * BourseOffre - Offre de bourse / aide financière publiée par le service social ou
 * l'administration d'une université, consultable par les étudiants et pouvant faire
 * l'objet d'une candidature (CandidatureBourse).
 *
 * Distincte de {@link Bourse}, qui représente une bourse déjà accordée et rattachée à
 * un dossier social (issue du module Service Social existant).
 */
@Entity
@Table(name = "bourse_offres")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BourseOffre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String libelle;

    @Enumerated(EnumType.STRING)
    private TypeBourseOffre type;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double montant;

    @Builder.Default
    private String devise = "FC";

    private Integer pourcentage;

    @Builder.Default
    private Integer placesDisponibles = 0;

    @Builder.Default
    private Integer placesRestantes = 0;

    @ElementCollection
    @CollectionTable(name = "bourse_offre_conditions", joinColumns = @JoinColumn(name = "bourse_offre_id"))
    @Column(name = "condition_texte", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> conditions = new ArrayList<>();

    private LocalDate dateLimite;

    @ManyToOne
    @JoinColumn(name = "universite_id")
    private Universite universite;

    @Builder.Default
    private boolean actif = true;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (placesRestantes == null) placesRestantes = placesDisponibles;
    }

    public enum TypeBourseOffre {
        EXCELLENCE, SOCIALE, SPORT, MINISTERIELLE, REDUCTION
    }
}
