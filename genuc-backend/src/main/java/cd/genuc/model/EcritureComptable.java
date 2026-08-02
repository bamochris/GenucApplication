package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ecritures_comptables")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EcritureComptable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String libelle;

    @Column(nullable = false)
    private LocalDate dateEcriture;

    @ManyToOne
    @JoinColumn(name = "compte_debit_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private CompteComptable compteDebit;

    @ManyToOne
    @JoinColumn(name = "compte_credit_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private CompteComptable compteCredit;

    @Column(nullable = false)
    private Double montant;

    private String reference;

    private Long universiteId;

    private Long valideParId;

    @Builder.Default
    private boolean validee = false;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (dateEcriture == null) dateEcriture = LocalDate.now();
    }
}