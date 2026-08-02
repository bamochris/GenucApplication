package cd.genuc.repository;

import cd.genuc.model.DocumentAnalyse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentAnalyseRepository extends JpaRepository<DocumentAnalyse, Long> {

    List<DocumentAnalyse> findBySha256(String sha256);

    Optional<DocumentAnalyse> findByDossierIdAndCleDocument(Long dossierId, String cleDocument);
}
