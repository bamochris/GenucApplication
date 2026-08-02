package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "frais")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Frais {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 200)
    private String libelle;

    @Column(nullable = false)
    private Double montant;

    @Column(length = 5)
    @Builder.Default
    private String devise = "USD";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private CategorieFrais categorie;

    @Column(nullable = false)
    private String anneeAcademique;

    @Column(name = "promotion_id", nullable = false)
    private Long promotionId;

    private Long faculteId;

    private LocalDate dateLimite;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutFrais statut = StatutFrais.ACTIF;

    @Enumerated(EnumType.STRING)
    private TypeFrais type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    // ─── Canaux de paiement ouverts par l'admin ───────────────────
    /**
     * Modes de paiement autorisés pour ce frais, choisis par l'admin de l'université
     * au moment où il crée le frais (donc son affectation aux inscriptions).
     *
     * <p>Porté par le frais et non par chaque {@code AffectationFrais} : l'affectation
     * est <b>dérivée</b> du frais — {@code affecterFraisAuxInscriptions} y recopie déjà
     * montant et échéance. Dupliquer la configuration sur chaque ligne (une par étudiant
     * de la promotion) obligerait à la resynchroniser à chaque réaffectation.</p>
     *
     * <p>Vide = aucune restriction, tous les canaux de l'établissement sont ouverts —
     * comportement des frais créés avant cette option.</p>
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "frais_modes_paiement", joinColumns = @JoinColumn(name = "frais_id"))
    @Column(name = "mode_paiement", length = 30)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<Paiement.ModePaiement> modesPaiementAutorises = new LinkedHashSet<>();

    /**
     * Comptes bancaires ({@code informations_bancaires}) sur lesquels ce frais peut être
     * réglé. Vide = tous les comptes actifs de l'établissement.
     *
     * <p>Permet d'ouvrir plusieurs banques par frais, et d'en réserver certaines à
     * certains frais (compte dédié aux frais de laboratoire, par exemple).</p>
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "frais_banques", joinColumns = @JoinColumn(name = "frais_id"))
    @Column(name = "information_bancaire_id")
    @Builder.Default
    private Set<Long> banquesAutorisees = new LinkedHashSet<>();

    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime modifieLe;

    /**
     * Expose l'identifiant de la catégorie dans le JSON sans initialiser le proxy
     * (getId() sur un proxy Hibernate ne déclenche pas de chargement), alors que
     * l'association {@link #categorie} reste {@link JsonIgnore}. Permet au front de
     * repré-sélectionner la catégorie lors de l'édition d'un frais.
     */
    @JsonProperty("categorieId")
    @Transient
    public Long getCategorieId() {
        return categorie != null ? categorie.getId() : null;
    }

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        modifieLe = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        modifieLe = LocalDateTime.now();
    }

    public enum StatutFrais {
        ACTIF, INACTIF, ARCHIVE
    }

    public enum TypeFrais {
        ACADEMIQUE, INSCRIPTION, LABORATOIRE, BIBLIOTHEQUE, STAGE,
        SOUTENANCE, CARTE_ETUDIANT, SESSION_SPECIALE, AUTRE
    }
}