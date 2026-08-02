package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Transaction de paiement des FRAIS DE DOSSIER (candidat sans compte,
 * donc sans Inscription — c'est pourquoi elle ne peut pas passer par
 * Paiement/TransactionExterne, dont inscription_id est NOT NULL).
 *
 * Cycle : PENDING à l'initiation (appel opérateur) → SUCCESS/FAILED
 * uniquement via le webhook opérateur signé (TachPayWebhookService).
 * C'est la confirmation SUCCESS qui marque le DossierInscription payé —
 * jamais l'initiation.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "transactions_dossier", indexes = {
    @Index(name = "idx_tx_dossier_provider_external", columnList = "provider, external_id"),
    @Index(name = "idx_tx_dossier_numero", columnList = "numero_dossier")
})
public class TransactionDossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_dossier", nullable = false)
    private String numeroDossier;

    @Column(nullable = false, unique = true)
    private String reference;

    @Column(nullable = false)
    private String provider;   // VODACOM, AIRTEL, ORANGE, AFRIMONEY, STRIPE

    @Column(name = "external_id")
    private String externalId;

    private String telephone;

    private Double montant;

    @Column(length = 5)
    private String devise;

    @Column(nullable = false)
    private String status;     // PENDING, SUCCESS, FAILED

    @Column(name = "raw_response", columnDefinition = "text")
    private String rawResponse;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean estTerminale() {
        return "SUCCESS".equalsIgnoreCase(status) || "FAILED".equalsIgnoreCase(status);
    }
}
