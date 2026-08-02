package cd.genuc.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "affectations_frais")
@Getter
@Setter
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AffectationFrais {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "frais_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Frais frais;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    @JsonIgnore
    @ToString.Exclude
    private Promotion promotion;

    @Column(nullable = false)
    private Double montant;

    @Column(nullable = false)
    private Double reste;

    private LocalDate dateEcheance;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutAffectation statut = StatutAffectation.EN_ATTENTE;

    private String commentaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paiement_id")
    @JsonIgnore
    @ToString.Exclude
    private Paiement paiement;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime modifieLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        modifieLe = LocalDateTime.now();
        if (reste == null) {
            reste = montant;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        modifieLe = LocalDateTime.now();
    }

    // ─── Méthodes utilitaires ──────────────────────────────────
    public boolean estPayee() {
        return statut == StatutAffectation.PAYE;
    }

    public void appliquerPaiement(double montantPaye) {
        if (montantPaye <= 0) {
            throw new IllegalArgumentException("Le montant payé doit être positif");
        }
        if (reste <= 0) {
            throw new IllegalStateException("Cette affectation est déjà soldée");
        }
        double nouveauReste = reste - montantPaye;
        if (nouveauReste < 0) {
            throw new IllegalArgumentException("Le montant payé dépasse le reste dû");
        }
        this.reste = Math.round(nouveauReste * 100.0) / 100.0;
        if (this.reste == 0) {
            this.statut = StatutAffectation.PAYE;
        } else {
            this.statut = StatutAffectation.PARTIEL;
        }
    }

    public void annuler() {
        this.statut = StatutAffectation.ANNULE;
        this.reste = 0.0;
    }

    public double getMontantPaye() {
        return montant - reste;
    }
}