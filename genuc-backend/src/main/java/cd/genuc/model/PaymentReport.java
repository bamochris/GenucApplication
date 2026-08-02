package cd.genuc.model;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * PaymentReport Entity - Rapports financiers (journalier, mensuel, trimestriel)
 */
@Entity
@Table(name = "payment_reports", indexes = {
    @Index(name = "idx_payment_reports_universite", columnList = "universite_id"),
    @Index(name = "idx_payment_reports_date", columnList = "report_date"),
    @Index(name = "idx_payment_reports_type", columnList = "report_type")
}, uniqueConstraints = @UniqueConstraint(columnNames = {"universite_id", "report_date", "report_type"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String reportCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "universite_id")
    private Universite universite;

    @Column(nullable = false, length = 50)
    private String reportType; // DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUAL

    @Column(nullable = false)
    private LocalDate reportDate;

    @Column(nullable = false)
    private LocalDate periodStart;

    @Column(nullable = false)
    private LocalDate periodEnd;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalCollectedFc = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalCollectedUsd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalPendingFc = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalPendingUsd = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalRefundedFc = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalRefundedUsd = BigDecimal.ZERO;

    @Column(name = "number_of_transactions")
    @Builder.Default
    private Integer numberOfTransactions = 0;

    @Column(name = "number_of_students_paid")
    @Builder.Default
    private Integer numberOfStudentsPaid = 0;

    @Column(precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal collectionRate = BigDecimal.ZERO;

    @Column(columnDefinition = "jsonb")
    private String paymentMethodBreakdown; // JSON: {"MPESA": {"amount": 0, "count": 0}, ...}

    @CreationTimestamp
    @Column(name = "generated_at", nullable = false, updatable = false)
    private LocalDateTime generatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by")
    private Utilisateur generatedBy;
}
