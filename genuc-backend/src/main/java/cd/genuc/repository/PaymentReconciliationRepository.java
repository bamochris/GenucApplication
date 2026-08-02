package cd.genuc.repository;

import cd.genuc.model.PaymentReconciliation;
import cd.genuc.model.ReconciliationStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentReconciliationRepository extends JpaRepository<PaymentReconciliation, Long> {
    Optional<PaymentReconciliation> findByReconciliationCode(String reconciliationCode);
    
    List<PaymentReconciliation> findByUniversiteId(Long universiteId);
    
    Page<PaymentReconciliation> findByUniversiteId(Long universiteId, Pageable pageable);
    
    List<PaymentReconciliation> findByStatus(ReconciliationStatusEnum status);
    
    @Query("SELECT pr FROM PaymentReconciliation pr WHERE pr.universite.id = :universiteId AND pr.status = :status")
    List<PaymentReconciliation> findByUniversiteAndStatus(@Param("universiteId") Long universiteId, @Param("status") ReconciliationStatusEnum status);
    
    @Query("SELECT pr FROM PaymentReconciliation pr WHERE pr.bankStatementDate BETWEEN :startDate AND :endDate AND pr.universite.id = :universiteId")
    List<PaymentReconciliation> findByDateRangeAndUniversity(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("universiteId") Long universiteId);
}
