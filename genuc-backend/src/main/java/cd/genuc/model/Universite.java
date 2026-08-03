package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "universites")
public class Universite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Informations générales ────────────────────────────────
    @Column(nullable = false, length = 200)
    private String nom;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(length = 50)
    private String typeEtablissement;

    @Column(length = 50)
    private String statut;

    private Integer anneeFondation;

    @Column(columnDefinition = "TEXT")
    private String description;

    // ─── Informations administratives ──────────────────────────
    @Column(name = "agrement_numero", length = 50)
    private String agrementNumero;

    @Column(name = "agrement_date")
    private LocalDate agrementDate;

    @Column(length = 50)
    private String rccm;

    @Column(name = "id_nat", length = 50)
    private String idNat;

    @Column(length = 50)
    private String nif;

    // ─── Adresse et localisation ───────────────────────────────
    @Column(length = 255)
    private String adresse;

    @Column(nullable = false, length = 100)
    private String ville;

    @Column(length = 100)
    private String province;

    @Column(length = 100)
    private String commune;

    @Column(length = 100)
    private String quartier;

    @Column(length = 150)
    private String avenue;

    @Column(name = "parcelle", length = 50)
    private String parcelle;

    @Column(name = "gps", length = 100)
    private String gps;

    // ─── Contact ────────────────────────────────────────────────
    @Column(length = 50)
    private String telephone;

    @Column(name = "telephone_secondaire", length = 50)
    private String telephoneSecondaire;

    @Column(length = 150)
    private String email;

    @Column(length = 150)
    private String siteWeb;

    @Column(length = 150)
    private String facebook;

    @Column(length = 150)
    private String linkedin;

    // ─── Identité visuelle ──────────────────────────────────────
    // ✅ MODIFICATION : passage en TEXT pour stocker le Base64 (ou les URLs longues)
    @Column(columnDefinition = "TEXT")
    private String logo;

    @Column(columnDefinition = "TEXT")
    private String sceau;

    @Column(name = "couleur_principale", length = 7)
    private String couleurPrincipale;

    @Column(columnDefinition = "TEXT")
    private String signature;

    // ─── Documents légaux (chemins des PDF d'enregistrement) ───
    @Column(name = "document_agrement", columnDefinition = "TEXT")
    private String documentAgrement;

    @Column(name = "document_arrete", columnDefinition = "TEXT")
    private String documentArrete;

    @Column(name = "document_statuts", columnDefinition = "TEXT")
    private String documentStatuts;

    // ─── Responsable institutionnel ─────────────────────────────
    @Column(name = "recteur_nom", length = 100)
    private String recteurNom;

    @Column(name = "recteur_postnom", length = 100)
    private String recteurPostnom;

    @Column(name = "recteur_prenom", length = 100)
    private String recteurPrenom;

    @Column(name = "recteur_telephone", length = 50)
    private String recteurTelephone;

    @Column(name = "recteur_email", length = 150)
    private String recteurEmail;

    // Modules actifs des portails (JSON { "bibliotheque": true, ... }) :
    // pilotés par l'admin d'université, appliqués dynamiquement aux menus
    // des portails étudiant/professeur. Vide = tout actif.
    @Column(name = "modules_actifs", columnDefinition = "TEXT")
    private String modulesActifs;

    // ─── Paramètres académiques ─────────────────────────────────
    @Column(name = "annee_academique", length = 20)
    private String anneeAcademique;

    @Column(name = "systeme_notation", length = 20)
    private String systemeNote;

    @Column(name = "seuil_reussite")
    private Integer seuilReussite;

    @Column(name = "max_sessions")
    private Integer maxSessions;

    @Column(name = "lmd")
    private Boolean lmd;

    // ─── Paramètres financiers ──────────────────────────────────
    @Column(length = 10)
    private String devise;

    @Column(name = "frais_academiques")
    private Double fraisAcademiques;

    @Column(name = "frais_inscription")
    private Double fraisInscription;

    @Column(name = "frais_laboratoire")
    private Double fraisLabo;

    @Column(name = "frais_bibliotheque")
    private Double fraisBibliotheque;

    // ─── Informations de base (existantes) ─────────────────────
    @Builder.Default
    private Double fraisBase = 0.0;
    @Builder.Default
    private boolean inscriptionsOuvertes = false;
    @Builder.Default
    private boolean actif = true;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    // ════════════════════════════════════════════════════════════
    //  LISTES DE STRUCTURE ACADÉMIQUE (stockées en tables séparées)
    // ════════════════════════════════════════════════════════════
    @ElementCollection
    @CollectionTable(name = "universite_facultes",
                     joinColumns = @JoinColumn(name = "universite_id"))
    @Column(name = "nom")
    @Builder.Default
    private List<String> facultes = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "universite_departements",
                     joinColumns = @JoinColumn(name = "universite_id"))
    @Column(name = "nom")
    @Builder.Default
    private List<String> departements = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "universite_promotions",
                     joinColumns = @JoinColumn(name = "universite_id"))
    @Column(name = "nom")
    @Builder.Default
    private List<String> promotions = new ArrayList<>();

    // ════════════════════════════════════════════════════════════
    //  COMPTEURS EXPOSÉS AUX FICHES PUBLIQUES
    // ════════════════════════════════════════════════════════════
    //
    // Les cartes d'établissement affichaient un tiret partout : elles lisent
    // nbFacultes/nbDepartements/nbEtudiants, que l'API ne renvoyait pas.
    //
    // Les deux premiers sont dérivés des listes saisies au formulaire
    // d'enregistrement — la source retenue, parce qu'elle reflète exactement ce
    // que l'établissement a déclaré. Les entités Departement et Filiere, elles,
    // ne sont pas alimentées par cet enregistrement : s'en servir afficherait
    // zéro (voir la note sur la désynchronisation du référentiel).

    /** Nombre de facultés ou sections déclarées. Dérivé : jamais stocké. */
    public int getNbFacultes() {
        return facultes == null ? 0 : facultes.size();
    }

    /** Nombre de départements déclarés, toutes facultés confondues. */
    public int getNbDepartements() {
        return departements == null ? 0 : departements.size();
    }

    /**
     * Effectif étudiant réel : inscriptions VALIDE de l'établissement.
     *
     * <p>Renseigné par le service lors des listages publics, et non calculé ici :
     * il demande une requête, et l'exposer en dérivé sur l'entité provoquerait
     * une requête par établissement à chaque sérialisation.</p>
     *
     * <p>Reste nul tant qu'aucune inscription n'est validée — un zéro affiché
     * vaut mieux qu'un chiffre inventé.</p>
     */
    @Transient
    private Long nbEtudiants;

    // ─── Relations existantes ──────────────────────────────────
    // Pas de CascadeType.REMOVE : supprimer une université ne doit JAMAIS emporter
    // les inscriptions des étudiants (la FK en base bloquera, c'est voulu — la
    // désactivation passe par le soft-delete actif=false).
    @JsonIgnore
    @OneToMany(mappedBy = "universite", cascade = {CascadeType.PERSIST, CascadeType.MERGE}, fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<Inscription> inscriptions;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }
}