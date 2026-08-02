package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bons_paiement")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BonDePaiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @ToString.Exclude
    private Inscription inscription;

    @Column(nullable = false)
    private Double montant;

    @Column(nullable = false)
    private LocalDate dateEmission;

    @Column(nullable = false)
    private LocalDate dateExpiration;

    @Column(nullable = false)
    @Builder.Default
    private boolean utilise = false;

    /**
     * Image PNG du QR code en base64 <b>NU</b>, sans préfixe {@code data:image/png;base64,}.
     *
     * <p>Ce sont les lecteurs qui préfixent (PDF du bon, portail admin). Un préfixe
     * enregistré ici se retrouvait en double à la lecture, le décodage échouait et le
     * bon s'imprimait sans QR code — la formulation ambiguë de ce commentaire est ce qui
     * avait laissé les deux émetteurs diverger.</p>
     */
    @Column(columnDefinition = "TEXT")
    private String codeQR;

    // Contenu textuel lisible encodé dans le QR (coordonnées bancaires, mobile money, etc.)
    @Column(columnDefinition = "TEXT")
    private String contenuTexte;

    @Column(columnDefinition = "TEXT")
    private String observations;

    /**
     * Comptes bancaires sur lesquels CE bon doit être réglé — figés à l'émission.
     *
     * <p>La banque est désignée par l'admin sur le frais ; un bon ne regroupe que des
     * frais partageant au moins une banque, et n'affiche donc jamais un guichet où il
     * ne serait pas encaissable.</p>
     *
     * <p>Stockés sur le bon et non recalculés à l'impression : le PDF est régénéré
     * plus tard à partir du seul numéro, et la configuration des frais a pu changer
     * entre-temps. Un bon déjà remis à l'étudiant doit rester valable tel qu'il a été
     * imprimé.</p>
     *
     * <p>Vide = aucune restriction (tous les comptes actifs de l'établissement).</p>
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "bon_paiement_banques",
                     joinColumns = @JoinColumn(name = "bon_paiement_id"))
    @Column(name = "information_bancaire_id")
    @Builder.Default
    private java.util.Set<Long> banquesAutorisees = new java.util.LinkedHashSet<>();

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (dateEmission == null) {
            dateEmission = LocalDate.now();
        }
        if (dateExpiration == null) {
            dateExpiration = dateEmission.plusDays(7);
        }
        if (numero == null) {
            numero = genererNumero();
        }
    }

    private String genererNumero() {
        return "BP-" + LocalDate.now().getYear() + "-" + System.currentTimeMillis() % 1000000;
    }

    public boolean estExpire() {
        return LocalDate.now().isAfter(dateExpiration);
    }

    public boolean estUtilisable() {
        return !utilise && !estExpire();
    }
}