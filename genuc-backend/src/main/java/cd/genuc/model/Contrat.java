package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contrats")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contrat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numeroContrat;

    @ManyToOne
    @JoinColumn(name = "personnel_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Personnel personnel;

    @Enumerated(EnumType.STRING)
    private TypeContrat type;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutContrat statut = StatutContrat.ACTIF;

    private Double salaireBase;
    @Builder.Default
    private String devise = "USD";

    @Column(columnDefinition = "TEXT")
    private String description;

    private String documentUrl;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (numeroContrat == null) {
            numeroContrat = genererNumeroContrat();
        }
    }

    private String genererNumeroContrat() {
        int annee = LocalDate.now().getYear();
        return String.format("CTR-%d-%08d", annee, System.currentTimeMillis() % 100000000);
    }

    public enum TypeContrat {
        CDI, CDD, STAGE, VACATAIRE
    }

    public enum StatutContrat {
        ACTIF, EXPIRE, RESILIE
    }
}