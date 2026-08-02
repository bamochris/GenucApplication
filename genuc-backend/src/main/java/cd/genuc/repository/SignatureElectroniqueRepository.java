package cd.genuc.repository;

import cd.genuc.model.SignatureElectronique;
import cd.genuc.model.TypeDocumentSignable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SignatureElectroniqueRepository extends JpaRepository<SignatureElectronique, Long> {

    Optional<SignatureElectronique> findByTypeDocumentAndDocumentId(TypeDocumentSignable typeDocument, Long documentId);

    Optional<SignatureElectronique> findByCodeVerification(String codeVerification);
}
