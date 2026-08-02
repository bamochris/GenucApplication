package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meilleurs_etudiants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeilleurEtudiant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ══════════════════════════════════════════
    // INFORMATIONS PERSONNELLES
    // ══════════════════════════════════════════
    
    @Column(nullable = false)
    private String nomComplet;

    @Column(nullable = false, unique = true)
    private String email;

    private String telephone;

    @Column(columnDefinition = "TEXT")
    private String biographie;

    private String photoUrl;

    // ══════════════════════════════════════════
    // INFORMATIONS ACADÉMIQUES
    // ══════════════════════════════════════════

    private String universiteNom;

    private String filiereNom;

    private String niveau;

    private String anneeObtention;

    private Double moyenneGenerale;

    private String mention;

    private Integer rang;

    // ══════════════════════════════════════════
    // STATUT & PUBLICATION
    // ══════════════════════════════════════════

    @Column(nullable = false)
    @Builder.Default
    private Boolean publie = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutPalmares statut = StatutPalmares.EN_ATTENTE;
    // EN_ATTENTE → En attente de validation
    // VALIDE → Validé, sera publié
    // REJETE → Rejeté, ne sera pas publié

    // ══════════════════════════════════════════
    // VALIDATION & DOCUMENTS
    // ══════════════════════════════════════════

    private String certificatUrl;

    private LocalDate dateValidation;

    private Long valideParId;

    private String valideParNom;

    private String motifRejet;

    private LocalDate dateNotification; // Date d'envoi de l'email

    @Column(nullable = false)
    @Builder.Default
    private Boolean notifie = false;

    // ══════════════════════════════════════════
    // AUDIT
    // ══════════════════════════════════════════

    @Column(updatable = false, nullable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (statut == null) {
            statut = StatutPalmares.EN_ATTENTE;
        }
        if (publie == null) {
            publie = false;
        }
        if (notifie == null) {
            notifie = false;
        }
    }

    // ══════════════════════════════════════════
    // ÉNUMÉRATION
    // ══════════════════════════════════════════

    public enum StatutPalmares {
        EN_ATTENTE,  // En attente de validation
        VALIDE,      // Validé, sera publié
        REJETE       // Rejeté, ne sera pas publié
    }
}
