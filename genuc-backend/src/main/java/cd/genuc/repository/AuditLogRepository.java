package cd.genuc.repository;

import cd.genuc.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Récupérer les logs pour une entité donnée (ex: une inscription)
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);

    // Récupérer les logs d'un utilisateur
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Récupérer les logs par module
    List<AuditLog> findByModuleOrderByCreatedAtDesc(String module);

    // Récupérer les logs entre deux dates
    List<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime debut, LocalDateTime fin);

    // Compter les actions par type (pour statistiques)
    @Query("SELECT a.action, COUNT(a) FROM AuditLog a GROUP BY a.action")
    List<Object[]> countByAction();

    // Compter les logs par module
    @Query("SELECT a.module, COUNT(a) FROM AuditLog a GROUP BY a.module")
    List<Object[]> countByModule();

    // Récupérer les dernières actions d'un module
    @Query("SELECT a FROM AuditLog a WHERE a.module = :module ORDER BY a.createdAt DESC")
    List<AuditLog> findTop10ByModuleOrderByCreatedAtDesc(@Param("module") String module);

    // ─── Tableau de bord Administration Système ──────────────────

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.action = 'LOGIN'")
    long countConnexions();

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.action = 'LOGIN' AND a.success = false")
    long countEchecsConnexion();

    List<AuditLog> findByActionOrderByCreatedAtDesc(String action, org.springframework.data.domain.Pageable pageable);
}