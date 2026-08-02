package cd.genuc.repository;

import cd.genuc.model.TransactionExterne;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransactionExterneRepository extends JpaRepository<TransactionExterne, Long> {

    Optional<TransactionExterne> findByProviderAndExternalId(String provider, String externalId);

    Optional<TransactionExterne> findByPaiementId(Long paiementId);
}