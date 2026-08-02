package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnregistrementUniversiteRequest {
    // ─── Champs de l'université ──────────────────────────────
    private String nom;
    private String sigle;
    private String type;           // Université publique / privée / Institut supérieur
    private String province;
    private String ville;
    private String commune;
    private String zone;
    private String adresse;
    private String codePostal;
    private String telephone;
    private String telephoneFixe;
    private String email;
    private String siteWeb;
    private Integer anneeFondation;
    private String latitude;
    private String longitude;
    private String devise;         // USD / CDF / USD/CDF
    private String statut;         // En activité / Suspendue / En évaluation
    private String agrementNumero;
    private String arreteMinisteriel;
    private String dateAutorisation;

    // ─── Autorités ────────────────────────────────────────────
    private RecteurDTO recteur;

    // ─── Paramètres académiques ──────────────────────────────
    private String systeme;        // LMD / Ancien système / Mixte
    private String anneeAcademique; // ex: 2025-2026
    private Integer semestres;
    private Integer sessions;
    private String notation;       // Sur 20 / Sur 100
    private Boolean deliberation;

    // ─── Structure hiérarchique ──────────────────────────────
    private List<String> facultes;
    private Map<String, List<String>> departements;      // clé = nom faculté
    private Map<String, List<String>> options;           // clé = nom département
    private Map<String, List<PromotionDTO>> promotions;  // clé = nom option (filière)

    // ─── Cartes et personnel ──────────────────────────────────
    private Boolean carteEtudiant;
    private Boolean carteEnseignant;
    private Boolean cartePersonnel;
    private Boolean qrCode;
    private Boolean matriculeAuto;

    // ─── Modules ──────────────────────────────────────────────
    private Map<String, Boolean> modules;

    // ─── DTO interne pour le Recteur ─────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecteurDTO {
        private String nom;
        private String prenom;
        private String email;
        private String telephone;
    }

    // ─── DTO interne pour une promotion ──────────────────────
    // Contexte RDC : chaque promotion est organisée en vacation de jour,
    // du soir, ou les deux (ex. L1 → [JOUR], L2 → [JOUR, SOIR]).
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PromotionDTO {
        private String niveau;           // "L1", "L2", "L3", "M1", …
        private List<String> vacations;  // valeurs de TypeVacation : "JOUR", "SOIR"
    }
}