package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "laboratoires")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Laboratoire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String domaine;

    private String responsable;

    private String email;

    private String telephone;

    private Integer capacite;

    private String equipements;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutLaboratoire statut = StatutLaboratoire.ACTIF;

    // Nullable : les laboratoires institutionnels créés par l'université
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

    public enum StatutLaboratoire {
        ACTIF, INACTIF, EN_CONSTRUCTION
    }
}
