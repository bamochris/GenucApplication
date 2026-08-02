package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.hibernate.validator.constraints.URL;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "depenses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Depense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le libellé est obligatoire")
    @Column(nullable = false, length = 255)
    private String libelle;

    @NotNull(message = "Le montant est obligatoire")
    @Positive(message = "Le montant doit être supérieur à zéro")
    @Column(nullable = false)
    private Double montant;

    @Column(nullable = false)
    private LocalDate dateDepense;

    @NotNull(message = "La catégorie est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategorieDepense categorie;

    @Column(columnDefinition = "TEXT")
    private String description;

    @URL(message = "L'URL du justificatif doit être valide")
    private String justificatifUrl;

    private Long valideParId;

    @NotNull(message = "L'université est obligatoire")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (dateDepense == null) {
            dateDepense = LocalDate.now();
        }
    }

    public enum CategorieDepense {
        SALAIRE, FOURNITURE, ENTRETIEN, TRANSPORT, BOURSE, AUTRE
    }
}