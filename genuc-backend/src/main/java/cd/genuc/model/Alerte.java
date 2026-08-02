package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alertes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Alerte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NiveauAlerte niveau; // INFO, WARNING, CRITICAL

    @Enumerated(EnumType.STRING)
    private CategorieAlerte categorie; // INSCRIPTION, PAIEMENT, DELIBERATION, SYSTEME

    private Long universiteId;

    @Builder.Default
    private boolean vue = false;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    public enum NiveauAlerte {
        INFO, WARNING, CRITICAL
    }

    public enum CategorieAlerte {
        INSCRIPTION, PAIEMENT, DELIBERATION, SYSTEME
    }
}