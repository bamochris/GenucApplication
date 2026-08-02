package cd.genuc.model;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ExchangeRate Entity - Taux de change FC/USD dynamiques
 */
@Entity
@Table(name = "exchange_rates", indexes = {
    @Index(name = "idx_exchange_rates_active_date", columnList = "is_active,rate_date"),
    @Index(name = "idx_exchange_rates_effective", columnList = "effective_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeRate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String fromCurrency = "FC"; // Franc Congolais

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String toCurrency = "USD";

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal rate;

    @Column(length = 100)
    private String source; // CENTRAL_BANK, MARKET, MANUAL

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "rate_date", nullable = false)
    private LocalDate rateDate;

    @Column(name = "effective_at", nullable = false)
    private LocalDateTime effectiveAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Utilisateur updatedBy;
}
