package cd.genuc.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "parametres_lmd", uniqueConstraints = {
        @UniqueConstraint(columnNames = "universite_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParametresLMD {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "L'ID de l'université est obligatoire")
    @Column(name = "universite_id", nullable = false, unique = true)
    private Long universiteId;

    @NotNull(message = "Le seuil de réussite est obligatoire")
    @Min(value = 0, message = "Le seuil de réussite doit être au moins 0")
    @Column(name = "seuil_reussite", nullable = false)
    @Builder.Default
    private Double seuilReussite = 10.0;

    @NotNull(message = "Le nombre de crédits par UE est obligatoire")
    @Min(value = 1, message = "Les crédits par UE doivent être au moins 1")
    @Column(name = "credits_par_ue", nullable = false)
    @Builder.Default
    private Integer creditsParUE = 30;

    @NotNull(message = "L'indicateur de compensation est obligatoire")
    @Column(name = "compensation_autorisee", nullable = false)
    @Builder.Default
    private Boolean compensationAutorisee = true;

    @NotNull(message = "La dette maximale est obligatoire")
    @Min(value = 0, message = "La dette maximale doit être au moins 0")
    @Column(name = "dette_max", nullable = false)
    @Builder.Default
    private Integer detteMax = 2;

    @NotNull(message = "Les crédits annuels requis sont obligatoires")
    @Min(value = 1, message = "Les crédits annuels requis doivent être au moins 1")
    @Column(name = "credits_annuels_requis", nullable = false)
    @Builder.Default
    private Integer creditsAnnuelRequis = 60;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @PreUpdate
    @PrePersist
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }

    // Méthode utilitaire pour obtenir les paramètres par défaut pour une université
    public static ParametresLMD defaultsForUniversite(Long universiteId) {
        return ParametresLMD.builder()
                .universiteId(universiteId)
                .seuilReussite(10.0)
                .creditsParUE(30)
                .compensationAutorisee(true)
                .detteMax(2)
                .creditsAnnuelRequis(60)
                .build();
    }
}