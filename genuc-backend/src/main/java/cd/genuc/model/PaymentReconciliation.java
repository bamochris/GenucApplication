package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * PaymentReconciliation Entity - Réconciliation bancaire
 */
@Entity
@Table(name = "payment_reconciliation", indexes = {
    @Index(name = "idx_payment_reconciliation_universite", columnList = "universite_id"),
    @Index(name = "idx_payment_reconciliation_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentReconciliation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String reconciliationCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "universite_id")
    private Universite universite;

    @Column(name = "bank_statement_date", nullable = false)
    private LocalDate bankStatementDate;

    @Column(length = 500)
    private String bankStatementFile;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalExpected;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalReceived;

    @Column(precision = 15, scale = 2)
    private BigDecimal difference;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private ReconciliationStatusEnum status = ReconciliationStatusEnum.PENDING;

    @Column(name = "reconciliation_date")
    private LocalDate reconciliationDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reconciled_by")
    private Utilisateur reconciledBy;

    @OneToMany(mappedBy = "reconciliation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ReconciliationDetail> details = new HashSet<>();
}
