package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action;        // "LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "VALIDATE", "EXPORT", etc.

    @Column(name = "entity_type")
    private String entityType;    // "Inscription", "Paiement", "Utilisateur", "Diplome", "Connexion", etc.

    @Column(name = "entity_id")
    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String oldValue;      // JSON ou texte (avant modification)

    @Column(columnDefinition = "TEXT")
    private String newValue;      // JSON ou texte (après modification)

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;     // Nouveau : pour le navigateur/device

    @Column(name = "success")
    private Boolean success;      // Nouveau : pour les connexions (true = succès, false = échec)

    @Column(name = "error_message")
    private String errorMessage;  // Nouveau : message d'erreur en cas d'échec

    @Column(name = "module")
    private String module;        // Nouveau : module concerné (ex: "AUTH", "PAIEMENT", "NOTE", etc.)

    @Column(name = "duration_ms")
    private Long durationMs;      // Nouveau : durée de l'opération en millisecondes (optionnel)

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (success == null) success = true; // par défaut
    }
}