package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "projets_recherche")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetRecherche {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String financement;

    private Double montant;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutProjet statut = StatutProjet.EN_COURS;

    // Nullable : les projets institutionnels créés par l'université
    // (module Recherche admin, V5) n'ont pas de professeur propriétaire.
    @ManyToOne
    @JoinColumn(name = "professeur_id")
    @JsonIgnore
    @ToString.Exclude
    private Utilisateur professeur;

    @Column(name = "professeur_id", insertable = false, updatable = false)
    private Long professeurId;

    private String professeurNom;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    public enum StatutProjet {
        EN_COURS, TERMINE, SUSPENDU
    }
}
