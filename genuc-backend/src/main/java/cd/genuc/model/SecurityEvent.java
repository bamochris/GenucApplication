package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

/**
 * SecurityEvent Entity - Événements de sécurité (logins, permissions, accès aux données sensibles)
 */
@Entity
@Table(name = "security_events", indexes = {
    @Index(name = "idx_security_events_user", columnList = "user_id"),
    @Index(name = "idx_security_events_type", columnList = "event_type"),
    @Index(name = "idx_security_events_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String eventType; // LOGIN, LOGOUT, FAILED_LOGIN, PERMISSION_CHANGE, DATA_ACCESS

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Utilisateur user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id")
    private Universite universite;

    @Column(length = 50)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String status; // SUCCESS, FAILED, WARNING

    @Column(columnDefinition = "jsonb")
    private String metadata; // Additional JSON data

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
