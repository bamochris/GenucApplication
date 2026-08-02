package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "budgets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String libelle; // "Budget 2025"

    @Column(nullable = false)
    private Double montantTotal;

    @Builder.Default
    private Double montantUtilise = 0.0;

    @Enumerated(EnumType.STRING)
    private CategorieBudget categorie; // FONCTIONNEMENT, INVESTISSEMENT, SALAIRE

    private Integer annee;

    private Long universiteId;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (annee == null) annee = LocalDate.now().getYear();
    }

    public enum CategorieBudget {
        FONCTIONNEMENT,
        INVESTISSEMENT,
        SALAIRE,
        BOURSE,
        AUTRE
    }
}