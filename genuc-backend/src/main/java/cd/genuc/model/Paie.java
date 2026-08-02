package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "paies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Paie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numeroBulletin;

    @ManyToOne
    @JoinColumn(name = "personnel_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Personnel personnel;

    private String mois;
    private Integer annee;

    private Double salaireBase;
    private Double prime;
    private Double heuresSupplementaires;
    private Double indemnite;
    private Double totalBrut;

    private Double retenueCnss;
    private Double retenueImpots;
    private Double retenueMutuelle;
    private Double totalRetenues;

    private Double netAPayer;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutPaie statut = StatutPaie.EN_ATTENTE;

    private LocalDate datePaiement;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (numeroBulletin == null) {
            numeroBulletin = genererNumeroBulletin();
        }
        if (annee == null) annee = LocalDate.now().getYear();
    }

    private String genererNumeroBulletin() {
        int annee = LocalDate.now().getYear();
        return String.format("BUL-%d-%06d", annee, System.currentTimeMillis() % 1000000);
    }

    public enum StatutPaie {
        EN_ATTENTE, PAYE
    }
}
