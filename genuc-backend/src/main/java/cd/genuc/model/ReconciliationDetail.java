package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ReconciliationDetail Entity - Détails de réconciliation (transaction to bank statement mapping)
 */
@Entity
@Table(name = "reconciliation_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reconciliation_id")
    private PaymentReconciliation reconciliation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private Transaction transaction;

    @Column(length = 255)
    private String bankReference;

    @Column(precision = 15, scale = 2)
    private BigDecimal bankAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal transactionAmount;

    @Column(name = "is_matched")
    @Builder.Default
    private Boolean isMatched = false;

    @Column(name = "match_date")
    private LocalDateTime matchDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
