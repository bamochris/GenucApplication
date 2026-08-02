package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "validations_paie")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidationPaie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "paie_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Paie paie;

    @Column(nullable = false)
    private Long creeParId;

    private Long valideParId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutValidation statut = StatutValidation.EN_ATTENTE;

    private LocalDateTime dateCreation;
    private LocalDateTime dateValidation;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    public enum StatutValidation {
        EN_ATTENTE, VALIDE, REJETE
    }
}