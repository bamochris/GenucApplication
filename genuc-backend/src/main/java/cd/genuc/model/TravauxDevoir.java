package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "travaux_devoirs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravauxDevoir {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TypeTravail type = TypeTravail.DEVOIR;

    @Column(nullable = false)
    private LocalDateTime dateEcheance;

    private Double coefficient;

    private String urlConsignes;
    private String nomFichierConsignes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    @Column(nullable = false)
    private Long professeurId;

    private String professeurNom;

    private String anneeAcademique;

    @Builder.Default
    private boolean annule = false;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (anneeAcademique == null) {
            int annee = java.time.LocalDate.now().getYear();
            anneeAcademique = annee + "-" + (annee + 1);
        }
    }

    public enum TypeTravail {
        DEVOIR, TP, PROJET, EXERCICE
    }
}
