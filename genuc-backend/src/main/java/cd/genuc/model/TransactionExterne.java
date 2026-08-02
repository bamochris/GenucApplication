package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions_externes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionExterne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paiement_id", nullable = false)
    @ToString.Exclude
    private Paiement paiement;

    @Column(nullable = false, length = 50)
    private String provider;  // VODACOM, AIRTEL, ORANGE, STRIPE

    @Column(nullable = false, length = 255)
    private String externalId;

    @Column(nullable = false, length = 30)
    private String status;  // PENDING, SUCCESS, FAILED, CANCELLED

    @Column(columnDefinition = "TEXT")
    private String rawResponse;

    @Column(columnDefinition = "TEXT")
    private String rawRequest;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}