package cd.genuc.repository;

import cd.genuc.model.ReconciliationDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReconciliationDetailRepository extends JpaRepository<ReconciliationDetail, Long> {
    List<ReconciliationDetail> findByReconciliationId(Long reconciliationId);
    
    @Query("SELECT rd FROM ReconciliationDetail rd WHERE rd.reconciliation.id = :reconciliationId AND rd.isMatched = false")
    List<ReconciliationDetail> findUnmatchedByReconciliation(@Param("reconciliationId") Long reconciliationId);
    
    @Query("SELECT rd FROM ReconciliationDetail rd WHERE rd.reconciliation.id = :reconciliationId AND rd.isMatched = true")
    List<ReconciliationDetail> findMatchedByReconciliation(@Param("reconciliationId") Long reconciliationId);
}
