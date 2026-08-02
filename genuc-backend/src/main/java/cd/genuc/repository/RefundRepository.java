package cd.genuc.repository;

import cd.genuc.model.Refund;
import cd.genuc.model.PaymentStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {
    Optional<Refund> findByRefundCode(String refundCode);
    
    List<Refund> findByTransactionId(Long transactionId);
    
    List<Refund> findByStatus(PaymentStatusEnum status);
    
    @Query("SELECT r FROM Refund r WHERE r.transaction.universite.id = :universiteId AND r.status = :status")
    List<Refund> findByUniversiteAndStatus(@Param("universiteId") Long universiteId, @Param("status") PaymentStatusEnum status);
    
    @Query("SELECT r FROM Refund r WHERE r.requestedBy.id = :userId AND r.createdAt BETWEEN :startDate AND :endDate")
    List<Refund> findByRequesterAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
