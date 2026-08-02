package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transaction Entity - Toutes les transactions de paiement
 */
@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_transactions_student", columnList = "student_id"),
    @Index(name = "idx_transactions_universite", columnList = "universite_id"),
    @Index(name = "idx_transactions_status", columnList = "payment_status"),
    @Index(name = "idx_transactions_created", columnList = "created_at"),
    @Index(name = "idx_transactions_reference", columnList = "provider_transaction_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String transactionCode;

    @Column(nullable = false, length = 50)
    private String transactionType; // TUITION, ACCOMMODATION, EXAM_FEE, LIBRARY

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Etudiant student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "universite_id")
    private Universite universite;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amountFc;

    @Column(precision = 15, scale = 2)
    private BigDecimal amountUsd;

    @Column(length = 3)
    @Builder.Default
    private String currencyUsed = "FC";

    @Column(precision = 10, scale = 4)
    private BigDecimal exchangeRateUsed;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodEnum paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_provider_id")
    private PaymentProvider paymentProvider;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    @Builder.Default
    private PaymentStatusEnum paymentStatus = PaymentStatusEnum.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_status")
    @Builder.Default
    private TransactionStatusEnum transactionStatus = TransactionStatusEnum.INITIATED;

    @Column(length = 255)
    private String providerTransactionId; // External provider reference

    @Column(length = 500)
    private String description;

    @Column(length = 100)
    private String receiptNumber;

    @Column(length = 100)
    private String referenceNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ✅ Ajout du champ pour stocker les données brutes du callback
    @Column(columnDefinition = "TEXT")
    private String callbackData;

    @CreationTimestamp
    @Column(name = "initiated_at", nullable = false, updatable = false)
    private LocalDateTime initiatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Utilisateur createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private Utilisateur processedBy;
}