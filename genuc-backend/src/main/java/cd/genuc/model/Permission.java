package cd.genuc.model;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Permission Entity - Permissions granulaires (module, resource, action)
 */
@Entity
@Table(name = "permissions", indexes = {
    @Index(name = "idx_permissions_code", columnList = "code"),
    @Index(name = "idx_permissions_module", columnList = "module")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // e.g., "ACADEMIC:COURSE:CREATE"

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String module; // ACADEMIC, FINANCE, HR, STUDENT, etc.

    @Column(nullable = false, name = "resource_type")
    private String resourceType; // USERS, COURSES, PAYMENTS, etc.

    @Column(nullable = false)
    private String action; // CREATE, READ, UPDATE, DELETE, EXPORT

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Utilisateur createdBy;

    @OneToMany(mappedBy = "permission", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<RolePermission> rolePermissions = new HashSet<>();
}
