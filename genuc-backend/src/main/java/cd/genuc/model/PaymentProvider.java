package cd.genuc.model;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

/**
 * PaymentProvider Entity - Configuration des providers (Vodacom, Airtel, Orange)
 */
@Entity
@Table(name = "payment_providers", indexes = @Index(name = "idx_payment_providers_active", columnList = "is_active"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentProvider {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // Vodacom, Airtel, Orange, etc.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private PaymentMethodEnum providerType;

    @Column(nullable = false) // Encrypted
    private String apiKey;

    @Column // Encrypted
    private String apiSecret;

    @Column
    private String webhookUrl;

    @Column // Encrypted
    private String webhookSecret;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column
    @Builder.Default
    private Integer priority = 0;

    @Column(name = "timeout_seconds")
    @Builder.Default
    private Integer timeoutSeconds = 30;

    @Column(name = "max_retries")
    @Builder.Default
    private Integer maxRetries = 3;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Utilisateur createdBy;
}


