package cd.genuc.repository;

import cd.genuc.model.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {
    @Query("SELECT er FROM ExchangeRate er WHERE er.fromCurrency = :fromCurrency AND er.toCurrency = :toCurrency AND er.isActive = true ORDER BY er.effectiveAt DESC LIMIT 1")
    Optional<ExchangeRate> findLatestActiveRate(@Param("fromCurrency") String fromCurrency, @Param("toCurrency") String toCurrency);
    
    @Query("SELECT er FROM ExchangeRate er WHERE er.fromCurrency = :fromCurrency AND er.toCurrency = :toCurrency AND er.rateDate = :rateDate")
    Optional<ExchangeRate> findByDateAndCurrencies(@Param("rateDate") LocalDate rateDate, @Param("fromCurrency") String fromCurrency, @Param("toCurrency") String toCurrency);
    
    List<ExchangeRate> findByIsActiveTrueOrderByEffectiveAtDesc();
    
    List<ExchangeRate> findByRateDateBetween(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT er FROM ExchangeRate er WHERE er.isActive = true AND er.effectiveAt <= :dateTime ORDER BY er.effectiveAt DESC LIMIT 1")
    Optional<ExchangeRate> findLatestRateAsOf(@Param("dateTime") LocalDateTime dateTime);
}
