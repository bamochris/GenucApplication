package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Demande de reconnaissance d'équivalence d'un diplôme obtenu ailleurs (autre établissement
 * RDC ou étranger) — soumise par l'étudiant, examinée et décidée par la commission académique
 * de l'université (admin/doyen/chef de département).
 */
@Entity
@Table(name = "equivalences_diplomes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquivalenceDiplome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Etudiant etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    // ─── Diplôme d'origine ──────────────────────────────────────
    @Column(nullable = false)
    private String etablissementOrigine;

    @Column(nullable = false)
    private String paysOrigine;

    @Column(nullable = false)
    private String diplomeObtenu;

    private String domaineEtude;

    private Integer anneeObtention;

    // Niveau texte libre (ex: "Graduat", "Licence", "Bachelor", "Master")
    private String niveauObtenu;

    // ─── Équivalence demandée ───────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filiere_id")
    @JsonIgnore
    @ToString.Exclude
    private Filiere filiereDemandee;

    private String niveauDemande; // ex: "L2", "L3", "M1"

    // ─── Pièces justificatives (S3) ──────────────────────────────
    private String diplomeDocumentUrl;
    private String releveNotesDocumentUrl;

    // ─── Traitement ──────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutEquivalence statut = StatutEquivalence.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String decisionMotif;

    // Niveau réellement accordé si APPROUVEE / APPROUVEE_PARTIELLE (peut différer du niveau demandé)
    private String niveauAccorde;

    private Long traiteParId;

    @Column(updatable = false)
    private LocalDateTime dateSoumission;

    private LocalDateTime dateDecision;

    @PrePersist
    protected void onCreate() {
        dateSoumission = LocalDateTime.now();
    }

    public enum StatutEquivalence {
        EN_ATTENTE, EN_EXAMEN, APPROUVEE, APPROUVEE_PARTIELLE, REJETEE
    }
}
