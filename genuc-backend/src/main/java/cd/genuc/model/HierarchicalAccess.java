package cd.genuc.model;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

/**
 * HierarchicalAccess Entity - Contrôle d'accès par niveau hiérarchique
 */
@Entity
@Table(name = "hierarchical_access", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "universite_id", "departement_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HierarchicalAccess {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private Utilisateur user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "universite_id")
    private Universite universite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departement_id")
    private Departement departement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id")
    private Faculte faculty;

    @Column(name = "can_view_all_students")
    @Builder.Default
    private Boolean canViewAllStudents = false;

    @Column(name = "can_manage_staff")
    @Builder.Default
    private Boolean canManageStaff = false;

    @Column(name = "can_modify_grades")
    @Builder.Default
    private Boolean canModifyGrades = false;

    @Column(name = "can_process_payments")
    @Builder.Default
    private Boolean canProcessPayments = false;

    @Column(name = "can_export_data")
    @Builder.Default
    private Boolean canExportData = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
