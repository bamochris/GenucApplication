package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * UniversitePaymentSettings Entity - Configuration des paiements par université
 */
@Entity
@Table(name = "universite_payment_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UniversitePaymentSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "universite_id", unique = true)
    private Universite universite;

    @Column(length = 3)
    @Builder.Default
    private String primaryCurrency = "FC";

    @Column(name = "allow_partial_payments")
    @Builder.Default
    private Boolean allowPartialPayments = true;

    @Column(name = "max_payment_delay_days")
    @Builder.Default
    private Integer maxPaymentDelayDays = 30;

    @Column(name = "late_payment_interest", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal latePaymentInterest = new BigDecimal("5.00");

    @Column(name = "discount_if_paid_early", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountIfPaidEarly = BigDecimal.ZERO;

    @Column(columnDefinition = "text[]")
    private String[] paymentMethods; // Array of payment method enums

    @Column(name = "webhook_secret")
    private String webhookSecret; // Encrypted

    // ─── Comptes d'encaissement de l'université ─────────────────
    // Numéros marchands mobile money qui REÇOIVENT l'argent de l'université
    @Column(name = "mpesa_numero", length = 20)
    private String mpesaNumero;          // Vodacom M-Pesa

    @Column(name = "orange_money_numero", length = 20)
    private String orangeMoneyNumero;    // Orange Money

    @Column(name = "airtel_money_numero", length = 20)
    private String airtelMoneyNumero;    // Airtel Money

    // Compte bancaire pour les paiements par carte / virement
    @Column(name = "banque_nom", length = 100)
    private String banqueNom;

    @Column(name = "banque_compte", length = 50)
    private String banqueCompte;         // N° de compte / IBAN

    @Column(name = "banque_swift", length = 20)
    private String banqueSwift;

    @Column(name = "banque_titulaire", length = 150)
    private String banqueTitulaire;      // Intitulé du compte

    // Encaissement en espèces à la caisse de l'université
    @Column(name = "accepte_especes")
    @Builder.Default
    private Boolean accepteEspeces = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Utilisateur updatedBy;
}
