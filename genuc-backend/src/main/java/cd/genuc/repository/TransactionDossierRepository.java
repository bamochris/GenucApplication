package cd.genuc.repository;

import cd.genuc.model.TransactionDossier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionDossierRepository extends JpaRepository<TransactionDossier, Long> {

    Optional<TransactionDossier> findByProviderAndExternalId(String provider, String externalId);

    Optional<TransactionDossier> findByReference(String reference);
}
