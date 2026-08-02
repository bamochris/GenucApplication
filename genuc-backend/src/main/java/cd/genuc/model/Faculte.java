package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant une Faculté au sein d'une Université
 * Plateforme GENUC - République Démocratique du Congo
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "facultes")
public class Faculte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Informations générales ────────────────────────────────
    @Column(nullable = false, length = 150)
    private String nom;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(length = 500)
    private String description;

    // ─── Relation avec l'université ────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    // ─── Contact et localisation ───────────────────────────────
    @Column(length = 100)
    private String telephone;

    @Column(length = 150)
    private String email;

    @Column(length = 255)
    private String localisation;

    @Column(columnDefinition = "TEXT")
    private String adresse;

    // ─── Responsable ────────────────────────────────────────────
    @Column(name = "doyen_nom", length = 100)
    private String doyenNom;

    @Column(name = "doyen_postnom", length = 100)
    private String doyenPostnom;

    @Column(name = "doyen_prenom", length = 100)
    private String doyenPrenom;

    @Column(name = "doyen_email", length = 150)
    private String doyenEmail;

    @Column(name = "doyen_telephone", length = 50)
    private String doyenTelephone;

    // ─── Paramètres académiques ─────────────────────────────────
    @Column(name = "nombre_departements")
    @Builder.Default
    private Integer nombreDepartements = 0;

    @Column(name = "nombre_programmes")
    @Builder.Default
    private Integer nombreProgrammes = 0;

    @Column(name = "nombre_etudiants")
    @Builder.Default
    private Integer nombreEtudiants = 0;

    @Column(name = "nombre_enseignants")
    @Builder.Default
    private Integer nombreEnseignants = 0;

    // ─── Identité visuelle ──────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String logo;

    @Column(name = "couleur_principale", length = 7)
    private String couleurPrincipale;

    // ─── État et audit ──────────────────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ─── Collections (Relations) ────────────────────────────────
    @JsonIgnore
    @OneToMany(mappedBy = "faculte", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Builder.Default
    private List<Departement> departements = new ArrayList<>();

    // ✅ SUPPRESSION de la liste "programmes" qui causait l'erreur.
    // La relation Faculte → Filiere n'existe pas directement ;
    // elle passe par Departement. Cette liste était mal mappée
    // et n'est utilisée nulle part dans l'application.

    // ─── Lifecycle Callbacks ────────────────────────────────────
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}