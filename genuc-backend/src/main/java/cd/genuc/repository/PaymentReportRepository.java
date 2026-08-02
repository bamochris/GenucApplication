package cd.genuc.repository;

import cd.genuc.model.PaymentReport;
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
public interface PaymentReportRepository extends JpaRepository<PaymentReport, Long> {
    Optional<PaymentReport> findByReportCode(String reportCode);
    
    List<PaymentReport> findByUniversiteId(Long universiteId);
    
    Page<PaymentReport> findByUniversiteId(Long universiteId, Pageable pageable);
    
    @Query("SELECT pr FROM PaymentReport pr WHERE pr.universite.id = :universiteId AND pr.reportType = :reportType AND pr.reportDate BETWEEN :startDate AND :endDate")
    List<PaymentReport> findByUniversiteAndTypeAndDateRange(@Param("universiteId") Long universiteId, @Param("reportType") String reportType, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT pr FROM PaymentReport pr WHERE pr.universite.id = :universiteId AND pr.reportType = :reportType ORDER BY pr.reportDate DESC")
    List<PaymentReport> findLatestReportByType(@Param("universiteId") Long universiteId, @Param("reportType") String reportType);
}
