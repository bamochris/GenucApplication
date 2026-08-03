package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "promotions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String libelle;  // Ex: "L1", "L2", "L3", "M1", "M2", "D1", "D2", "D3"

    @Column(length = 50)
    private String code;     // Ex: "L1_INFO", "M2_DROIT"

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Niveau niveau = Niveau.L1;

    @Builder.Default
    private Integer creditsRequis = 60;

    @Builder.Default
    private Integer dureeAnnees = 1;

    @Builder.Default
    private boolean actif = true;

    // Vacations proposées pour cette promotion — CSV de TypeVacation :
    // "JOUR", "SOIR" ou "JOUR,SOIR" (contexte RDC : cours de jour et/ou du soir)
    @Column(length = 50)
    private String vacations;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (code == null && libelle != null && filiere != null) {
            code = genererCode();
        }
    }

    private String genererCode() {
        String prefixe = filiere != null && filiere.getCode() != null 
            ? filiere.getCode() 
            : "GEN";
        return prefixe + "_" + libelle;
    }

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filiere_id", nullable = false)
    @ToString.Exclude
    private Filiere filiere;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annee_academique_id", nullable = false)
    @ToString.Exclude
    private AnneeAcademique anneeAcademique;

    // Enum pour les niveaux
    public enum Niveau {
        L1("Licence 1"),
        L2("Licence 2"),
        L3("Licence 3"),
        M1("Master 1"),
        M2("Master 2"),
        D1("Doctorat 1"),
        D2("Doctorat 2"),
        D3("Doctorat 3");

        private final String description;

        Niveau(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    // Méthodes utilitaires
    public boolean isLicence() {
        return libelle != null && libelle.startsWith("L");
    }

    public boolean isMaster() {
        return libelle != null && libelle.startsWith("M");
    }

    public boolean isDoctorat() {
        return libelle != null && libelle.startsWith("D");
    }

    public int getAnnee() {
        if (libelle != null && libelle.length() >= 2) {
            try {
                return Integer.parseInt(libelle.substring(1));
            } catch (NumberFormatException e) {
                return 1;
            }
        }
        return 1;
    }

    public String getNiveauSuivant() {
        if (libelle == null) return null;

        switch (libelle.trim().toUpperCase()) {
            case "L1": return "L2";
            case "L2": return "L3";
            case "L3": return "M1";
            case "M1": return "M2";
            case "M2": return "D1";
            case "D1": return "D2";
            case "D2": return "D3";
            case "D3": return null;   // fin de cycle doctoral
            // Systeme congolais classique (graduat)
            case "G1": return "G2";
            case "G2": return "G3";
            case "G3": return null;   // fin de graduat = diplome
            case "PREPA": case "P0": return "G1";
            default:
                // Libelles libres (donnees migrees) : prefixe+numero incremente
                java.util.regex.Matcher m = java.util.regex.Pattern
                    .compile("^(.*?)([0-9]+)$").matcher(libelle.trim());
                if (m.matches()) {
                    return m.group(1) + (Integer.parseInt(m.group(2)) + 1);
                }
                return null;
        }
    }

    public boolean isDerniereAnnee() {
        return estNiveauDiplomant(libelle);
    }

    /**
     * Le niveau donne-t-il lieu à un diplôme en fin d'année ?
     *
     * <p>À ne pas confondre avec « il n'existe pas de niveau suivant » : un L3
     * délivre une licence <em>et</em> ouvre sur le M1. Les deux notions sont
     * distinctes, d'où une règle propre.</p>
     *
     * <p><b>G3 y figure</b> : c'est la fin du graduat du système congolais
     * classique, le cycle le plus répandu dans les établissements desservis.
     * Son absence des listes historiques faisait proposer ADMIS au lieu de
     * DIPLOME au jury ; or la délivrance d'un diplôme exige la décision
     * DIPLOME. Aucun gradué ne pouvait donc obtenir son titre.</p>
     *
     * <p>Règle centralisée ici parce qu'elle était recopiée dans
     * {@code DeliberationService.proposerDecision} : deux copies d'une même
     * liste divergent, et c'est exactement ce qui s'est produit.</p>
     */
    public static boolean estNiveauDiplomant(String libelle) {
        if (libelle == null) return false;
        String n = libelle.trim().toUpperCase();
        return "L3".equals(n) || "M2".equals(n) || "D3".equals(n) || "G3".equals(n);
    }
}