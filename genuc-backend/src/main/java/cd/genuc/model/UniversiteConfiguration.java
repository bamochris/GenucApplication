package cd.genuc.model;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * UniversiteConfiguration Entity - Configuration par université
 */
@Entity
@Table(name = "universite_configurations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UniversiteConfiguration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "universite_id", unique = true)
    private Universite universite;

    @Column(length = 3)
    @Builder.Default
    private String primaryCurrency = "FC";

    @Column(length = 3)
    @Builder.Default
    private String secondaryCurrency = "USD";

    @Column(length = 20)
    @Builder.Default
    private String academicYearFormat = "YYYY-MM";

    @Column(length = 50)
    private String gradingSystem = "SCALE_20"; // SCALE_20, SCALE_100, GPA_4

    @Column(precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal minimumPassingGrade = new BigDecimal("10.0");

    @Column(name = "credit_hours_per_course")
    @Builder.Default
    private Integer creditHoursPerCourse = 3;

    @Column(length = 100)
    @Builder.Default
    private String timezone = "Africa/Kinshasa";

    @Column(length = 20)
    @Builder.Default
    private String language = "FR";

    @Column(length = 500)
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String footerText;

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
