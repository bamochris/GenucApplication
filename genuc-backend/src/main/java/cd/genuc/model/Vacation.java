package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vacations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vacation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom; // ex: "Vacation Jour 2025-2026", "Vacation Soir 2025-2026"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TypeVacation type = TypeVacation.JOUR;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = false)
    private LocalDate dateFin;

    @Builder.Default
    private boolean inscriptionsOuvertes = true;

    @Builder.Default
    private boolean actif = true;

    // Frais spécifiques à cette vacation (ex: frais d'inscription supplémentaires)
    private Double fraisInscription;

    @Builder.Default
    private String deviseFrais = "USD";

    // Capacité maximale d'étudiants
    private Integer capaciteMax;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annee_academique_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private AnneeAcademique anneeAcademique;

    @OneToMany(mappedBy = "vacation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @Builder.Default
    private List<CoursVacation> coursVacations = new ArrayList<>();

    @OneToMany(mappedBy = "vacation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @Builder.Default
    private List<InscriptionVacation> inscriptions = new ArrayList<>();

    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime modifieLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        modifieLe = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        modifieLe = LocalDateTime.now();
    }

    public boolean isInscriptionsOuvertes() {
        return inscriptionsOuvertes && actif;
    }

    public int getNbEtudiantsInscrits() {
        return inscriptions != null ? inscriptions.size() : 0;
    }
}
