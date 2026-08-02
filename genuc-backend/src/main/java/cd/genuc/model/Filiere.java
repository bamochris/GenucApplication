package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "filieres")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Filiere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(length = 50)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private NiveauFiliere niveau = NiveauFiliere.LICENCE;

    @Builder.Default
    private Integer dureeAnnees = 3;

    @Builder.Default
    private Integer creditsTotal = 180;

    @Builder.Default
    private boolean actif = true;

    // ══════════════════════════════════════════
    // Inscriptions ouvertes pour cette filière
    // ══════════════════════════════════════════
    @Builder.Default
    private boolean inscriptionsOuvertes = true;

    // ══════════════════════════════════════════
    // ✅ NOUVEAUX CHAMPS : Détails pour l'affichage public
    // ══════════════════════════════════════════
    private Double fraisAnnee1;
    private Double fraisAnnee2;
    private Double fraisAnnee3;

    @Builder.Default
    private String deviseFrais = "USD";

    @Column(columnDefinition = "TEXT")
    private String debouches;          // Liste des débouchés (séparés par des sauts de ligne)

    @Column(columnDefinition = "TEXT")
    private String conditionsAdmission;

    @Column(columnDefinition = "TEXT")
    private String programmeResume;

    // Documents à téléverser pour s'inscrire à cette filière, prédéfinis par
    // l'admin de l'université et affichés publiquement (fiche filière +
    // formulaire d'inscription). Tableau JSON :
    // [{"key":"diplomeEtat","obligatoire":true}, ...]
    @Column(name = "documents_requis", columnDefinition = "TEXT")
    private String documentsRequis;

    // Test d'admission exigé pour cette filière (choix du secrétaire académique
    // ou de l'admin). Quand true, TOUT candidat à cette filière doit réussir le
    // test d'admission avant que son dossier puisse être validé — en plus de la
    // règle automatique (< 60 % au diplôme d'État), qui reste active.
    // columnDefinition avec « default false » : indispensable pour que Hibernate
    // (ddl-auto=update en dev) puisse ajouter la colonne à la table filieres déjà
    // peuplée sans violer la contrainte NOT NULL (les lignes existantes → false).
    @Builder.Default
    @Column(name = "test_admission_requis", nullable = false, columnDefinition = "boolean default false")
    private boolean testAdmissionRequis = false;

    // ══════════════════════════════════════════
    // Relations
    // ══════════════════════════════════════════
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departement_id")
    @ToString.Exclude
    private Departement departement;

    // ══════════════════════════════════════════
    // Audit
    // ══════════════════════════════════════════
    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    // ══════════════════════════════════════════
    // Enum NiveauFiliere (inchangé)
    // ══════════════════════════════════════════
    public enum NiveauFiliere {
        LICENCE,        // Bac+3
        MASTER,         // Bac+5
        DOCTORAT,       // Bac+8
        CYCLE_COURT,    // Bac+2
        SPECIALISATION  // Post-graduat
    }
}
