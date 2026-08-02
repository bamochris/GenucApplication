package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "caisses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Caisse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    private Long ouverteParId;
    private Long fermeeParId;

    private LocalDate dateOuverture;
    private LocalDate dateFermeture;

    @Column(nullable = false)
    @Builder.Default
    private Double soldeInitial = 0.0;

    @Builder.Default
    private Double soldeFinal = 0.0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutCaisse statut = StatutCaisse.OUVERTE;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        dateOuverture = LocalDate.now();
    }

    public enum StatutCaisse {
        OUVERTE, FERMEE
    }
}