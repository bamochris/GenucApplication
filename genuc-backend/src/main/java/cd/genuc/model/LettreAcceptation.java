package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 📄 Lettre d'Acceptation officielle avec en-tête MINESU (RDC)
 * Générée pour un étudiant inscrit à une vacation (Jour/Soir).
 */
@Entity
@Table(name = "lettres_acceptation")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LettreAcceptation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String numeroLettre;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    @Builder.Default
    private boolean emise = false;

    private LocalDate dateEmission;

    @Builder.Default
    private String uuidVerification = java.util.UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_vacation_id", nullable = false)
    @ToString.Exclude
    private InscriptionVacation inscriptionVacation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    @ToString.Exclude
    private Etudiant etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @ToString.Exclude
    private Universite universite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacation_id", nullable = false)
    @ToString.Exclude
    private Vacation vacation;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime modifieLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        modifieLe = LocalDateTime.now();
        if (numeroLettre == null) {
            numeroLettre = genererNumeroLettre();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        modifieLe = LocalDateTime.now();
    }

    /**
     * Génère un numéro de lettre au format : LA-ANNEE-NNNNNN
     * Exemple : LA-2025-000001
     */
    private String genererNumeroLettre() {
        return "LA-" + LocalDate.now().getYear() + "-" + String.format("%06d", this.hashCode() & 0xFFFFF);
    }
}
