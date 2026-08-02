package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Migration assistée : intégration d'une université qui possède déjà des
 * étudiants (historique, promotions, facultés, matricules, situation
 * financière) depuis un fichier Excel/CSV, via un assistant en 8 étapes.
 * L'état complet est persisté à chaque étape pour permettre la reprise
 * exacte (fermeture du navigateur, pause, erreurs partielles).
 */
@Entity
@Table(name = "migrations_import")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MigrationImport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;                      // Ex: "Migration HEC-KIN 2026"

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "universite_id")
    @ToString.Exclude
    private Universite universite;

    private String anneeAcademique;          // Ex: "2025-2026"

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TypeFichier typeFichier = TypeFichier.CSV;

    private String nomFichierOriginal;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutMigration statut = StatutMigration.EN_ATTENTE;

    // Étape courante de l'assistant (1 à 8) — permet de reprendre exactement là
    // où l'utilisateur s'était arrêté.
    @Builder.Default
    private int etape = 1;

    // ─── Données persistées de l'assistant (JSON) ────────────────
    @Column(columnDefinition = "TEXT")
    private String colonnesJson;             // En-têtes détectés dans le fichier

    @Column(columnDefinition = "TEXT")
    private String mappingJson;              // { "colonne fichier": "champ GENUC" }

    @Column(columnDefinition = "TEXT")
    private String statsJson;                // Résumés d'analyse / simulation / import

    @Column(columnDefinition = "TEXT")
    private String optionsJson;              // { creerStructures, strategieDoublon, ... }

    // ─── Progression ─────────────────────────────────────────────
    @Builder.Default
    private int totalLignes = 0;
    @Builder.Default
    private int lignesImportees = 0;
    @Builder.Default
    private int lignesIgnorees = 0;
    @Builder.Default
    private int lignesErreur = 0;
    @Builder.Default
    private int progression = 0;             // 0..100

    private String creePar;                  // email de l'admin

    @Column(updatable = false)
    private LocalDateTime creeLe;
    private LocalDateTime majLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        majLe = creeLe;
    }

    @PreUpdate
    protected void onUpdate() {
        majLe = LocalDateTime.now();
    }

    public enum TypeFichier { CSV, EXCEL }

    public enum StatutMigration {
        EN_ATTENTE,     // créée, fichier déposé
        ANALYSE,        // analyse terminée, en attente de mapping
        MAPPING,        // mapping confirmé
        VERIFICATION,   // vérification faite, corrections en cours
        SIMULATION,     // simulation faite, prête à importer
        EN_COURS,       // import par lots en cours
        PAUSE,          // import suspendu par l'utilisateur
        ERREURS,        // import terminé mais lignes rejetées à corriger
        TERMINE,        // import terminé sans reste
        ANNULE          // annulée (rollback effectué si nécessaire)
    }
}
