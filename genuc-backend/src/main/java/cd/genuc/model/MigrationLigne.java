package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/**
 * Une ligne du fichier de migration : données brutes (corrigeables en ligne),
 * erreurs détectées avec leur niveau, et traçabilité des entités créées à
 * l'import (pour l'annulation/rollback et la réimportation ciblée).
 */
@Entity
@Table(name = "migrations_lignes", indexes = {
    @Index(name = "idx_migl_migration", columnList = "migration_id"),
    @Index(name = "idx_migl_statut", columnList = "statut")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MigrationLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "migration_id")
    @ToString.Exclude
    private MigrationImport migration;

    private int numeroLigne;                 // Numéro dans le fichier source (1-based, hors en-tête)

    @Column(columnDefinition = "TEXT")
    private String donneesJson;              // { "colonne fichier": "valeur" } — mis à jour par les corrections

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutLigne statut = StatutLigne.VALIDE;

    @Column(columnDefinition = "TEXT")
    private String erreursJson;              // [ { champ, niveau: VERT|ORANGE|ROUGE, message } ]

    // Décision de l'utilisateur pour les doublons (matricule déjà en base) :
    // CREER (nouveau), METTRE_A_JOUR (fusionner sur l'existant), IGNORER.
    @Enumerated(EnumType.STRING)
    private ActionDoublon action;

    // Traçabilité pour rollback / réimport ciblé
    private Long inscriptionId;
    private Long paiementId;
    private Long etudiantId;   // renseigné uniquement si l'étudiant a été créé par la migration

    public enum StatutLigne {
        VALIDE,         // prête à importer
        AVERTISSEMENT,  // importable, avec avertissements (orange)
        ERREUR,         // bloquante (rouge) — à corriger
        IMPORTEE,       // importée avec succès
        IGNOREE         // volontairement ignorée (doublon, choix utilisateur)
    }

    public enum ActionDoublon { CREER, METTRE_A_JOUR, IGNORER }
}
