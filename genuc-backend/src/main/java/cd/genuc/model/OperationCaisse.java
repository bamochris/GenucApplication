package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "operations_caisse")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationCaisse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "caisse_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Caisse caisse;

    @ManyToOne
    @JoinColumn(name = "paiement_id")
    @JsonIgnore
    @ToString.Exclude
    private Paiement paiement;

    @ManyToOne
    @JoinColumn(name = "depense_id")
    @JsonIgnore
    @ToString.Exclude
    private Depense depense;

    @Column(nullable = false)
    private Double montant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeOperation type;

    @Column(nullable = false)
    private Long operateurId;

    private String reference;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime dateOperation;

    private Double soldeApresOperation;

    @PrePersist
    protected void onCreate() {
        dateOperation = LocalDateTime.now();
    }

    public enum TypeOperation {
        ENCAISSEMENT, REMBOURSEMENT, DEPENSE
    }
}