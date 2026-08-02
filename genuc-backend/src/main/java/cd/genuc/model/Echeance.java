package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "echeances")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Echeance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer numeroEcheance;

    @Column(nullable = false)
    private Double montant;

    @Column(nullable = false)
    private LocalDate dateEcheance;

    private LocalDate datePaiement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutEcheance statut = StatutEcheance.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Builder.Default
    private Double penalite = 0.0;

    @ManyToOne
    @JoinColumn(name = "echeancier_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Echeancier echeancier;

    @ManyToOne
    @JoinColumn(name = "paiement_id")
    @JsonIgnore
    @ToString.Exclude
    private Paiement paiement;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    public enum StatutEcheance {
        EN_ATTENTE, PAYEE, PARTIELLE, EN_RETARD, ANNULEE
    }

    public void calculerPenalite(double penaliteParJour) {
        if (statut == StatutEcheance.PAYEE || statut == StatutEcheance.ANNULEE) {
            this.penalite = 0.0;
            return;
        }
        if (LocalDate.now().isAfter(dateEcheance)) {
            long joursRetard = java.time.temporal.ChronoUnit.DAYS.between(dateEcheance, LocalDate.now());
            this.penalite = joursRetard * penaliteParJour;
            if (statut != StatutEcheance.EN_RETARD) {
                this.statut = StatutEcheance.EN_RETARD;
            }
        } else {
            this.penalite = 0.0;
            if (statut == StatutEcheance.EN_RETARD) {
                this.statut = StatutEcheance.EN_ATTENTE;
            }
        }
    }
}