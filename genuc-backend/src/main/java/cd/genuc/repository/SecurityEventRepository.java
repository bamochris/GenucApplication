package cd.genuc.repository;

import cd.genuc.model.SecurityEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    List<SecurityEvent> findByUserId(Long userId);
    
    Page<SecurityEvent> findByUserId(Long userId, Pageable pageable);
    
    List<SecurityEvent> findByEventType(String eventType);
    
    @Query("SELECT se FROM SecurityEvent se WHERE se.user.id = :userId AND se.eventType = :eventType ORDER BY se.createdAt DESC")
    List<SecurityEvent> findByUserAndEventType(@Param("userId") Long userId, @Param("eventType") String eventType);
    
    @Query("SELECT se FROM SecurityEvent se WHERE se.createdAt BETWEEN :startDate AND :endDate")
    List<SecurityEvent> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT se FROM SecurityEvent se WHERE se.universite.id = :universiteId AND se.createdAt BETWEEN :startDate AND :endDate ORDER BY se.createdAt DESC")
    List<SecurityEvent> findByUniversiteAndDateRange(@Param("universiteId") Long universiteId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT se FROM SecurityEvent se WHERE se.status = :status AND se.createdAt BETWEEN :startDate AND :endDate")
    List<SecurityEvent> findFailedEventsByDateRange(@Param("status") String status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
