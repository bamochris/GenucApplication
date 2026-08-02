package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "remboursements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Remboursement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "paiement_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Paiement paiement;

    @ManyToOne
    @JoinColumn(name = "etudiant_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Etudiant etudiant;

    private Double montant;
    
    @Column(columnDefinition = "TEXT")
    private String motif;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutRemboursement statut = StatutRemboursement.EN_ATTENTE;

    private Long demandeurId;
    private Long verificateurId;
    private Long validateurMotifId;
    private Long autorisateurId;
    private Long executeurId;

    private LocalDateTime dateDemande;
    private LocalDateTime dateVerification;
    private LocalDateTime dateValidationMotif;
    private LocalDateTime dateAutorisation;
    private LocalDateTime dateExecution;

    private String commentaireVerification;
    private String commentaireValidationMotif;
    private String commentaireAutorisation;
    private String referenceRemboursement;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        dateDemande = LocalDateTime.now();
    }

    public enum StatutRemboursement {
        EN_ATTENTE, VERIFIE, MOTIF_VALIDE, AUTORISE, EXECUTE, REJETE
    }
}