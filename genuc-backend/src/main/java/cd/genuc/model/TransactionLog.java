package cd.genuc.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@lombok.Builder
public class TransactionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;   // Relation vers l'entité Transaction

    @Enumerated(EnumType.STRING)
    @Column(name = "status_from", length = 30)
    private TransactionStatusEnum statusFrom;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_to", length = 30, nullable = false)
    private TransactionStatusEnum statusTo;

    @Column(columnDefinition = "TEXT")
    private String message;   // Optionnel : détails du log

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}