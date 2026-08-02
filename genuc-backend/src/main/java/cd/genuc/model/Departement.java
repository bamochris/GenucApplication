package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "departements", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"code", "faculte_id"})
})
public class Departement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nom;

    @Column(nullable = false, length = 30)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean actif = true;

    // ✅ Nouveau champ type
    @Enumerated(EnumType.STRING)
    @Column(name = "type_dept")
    private TypeDepartement type;

    // ✅ Nouveau champ parent (hiérarchie)
    @ManyToOne
    @JoinColumn(name = "parent_id")
    @JsonIgnore
    @ToString.Exclude
    private Departement parent;

    // Relation avec Faculté (existante)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculte_id")
    @JsonIgnore
    @ToString.Exclude
    private Faculte faculte;

    // Université propriétaire — la colonne departements.universite_id est
    // NOT NULL en base ; le champ doit donc être renseigné à la création
    // (il reste cohérent avec faculte.getUniversite()).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    // Filières (existantes)
    @OneToMany(mappedBy = "departement", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @Builder.Default
    private List<Filiere> filieres = new ArrayList<>();

    // Responsable (existant)
    @Column(length = 100)
    private String chefNom;
    @Column(length = 100)
    private String chefPostnom;
    @Column(length = 100)
    private String chefPrenom;
    @Column(length = 150)
    private String chefEmail;
    @Column(length = 30)
    private String chefTelephone;

    // Audit (existant)
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ✅ Enum ajouté
    public enum TypeDepartement {
        FACULTE,
        DEPARTEMENT,
        SECTION,
        ECOLE,
        INSTITUT
    }

    // Méthodes utilitaires
    public void addFiliere(Filiere filiere) {
        filieres.add(filiere);
        filiere.setDepartement(this);
    }

    public void removeFiliere(Filiere filiere) {
        filieres.remove(filiere);
        filiere.setDepartement(null);
    }
}