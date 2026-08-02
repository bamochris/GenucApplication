package cd.genuc.repository;

import cd.genuc.model.PaymentProvider;
import cd.genuc.model.PaymentMethodEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentProviderRepository extends JpaRepository<PaymentProvider, Long> {
    Optional<PaymentProvider> findByName(String name);
    
    Optional<PaymentProvider> findByProviderType(PaymentMethodEnum providerType);
    
    List<PaymentProvider> findByIsActiveTrue();
    
    @Query(value = "SELECT * FROM payment_providers WHERE is_active = true ORDER BY priority DESC", nativeQuery = true)
    List<PaymentProvider> findActiveProvidersByPriority();
}
