package cd.genuc.repository;

import cd.genuc.model.RegleSignatureDocument;
import cd.genuc.model.TypeDocumentSignable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegleSignatureDocumentRepository extends JpaRepository<RegleSignatureDocument, Long> {

    List<RegleSignatureDocument> findByUniversiteId(Long universiteId);

    Optional<RegleSignatureDocument> findByUniversiteIdAndTypeDocument(Long universiteId, TypeDocumentSignable typeDocument);
}
