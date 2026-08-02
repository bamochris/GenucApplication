package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Barème de notation défini par un professeur : la pondération des composantes
 * (TP / Interrogation / Examen) utilisée pour calculer la note finale d'un cours,
 * ainsi que l'échelle de mentions (lignes) affichée dans l'UI.
 *
 * Consommé par le module Notes (CalculsNotes) pour remplacer la pondération
 * 30/20/50 codée en dur côté frontend par la pondération réelle du cours.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "baremes_evaluation")
public class BaremeEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    /** Cours associé (optionnel — un barème peut être générique). */
    private Long coursId;

    /** Libellé du cours, dénormalisé pour affichage. */
    private String coursNom;

    @Column(nullable = false)
    private Long professeurId;

    // ─── Pondération des composantes de la note finale (somme attendue = 100) ───
    @Builder.Default
    private Integer ponderationTP = 30;

    @Builder.Default
    private Integer ponderationInterro = 20;

    @Builder.Default
    private Integer ponderationExamen = 50;

    @ElementCollection
    @CollectionTable(name = "bareme_evaluation_lignes", joinColumns = @JoinColumn(name = "bareme_id"))
    @Builder.Default
    private List<BaremeLigne> lignes = new ArrayList<>();

    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime modifieLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        modifieLe = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        modifieLe = LocalDateTime.now();
    }
}
