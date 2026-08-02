package cd.genuc.repository;

import cd.genuc.model.DemandeSignature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeSignatureRepository extends JpaRepository<DemandeSignature, Long> {

    List<DemandeSignature> findBySignataireIdAndStatutOrderByCreeLeDesc(Long signataireId, DemandeSignature.Statut statut);

    List<DemandeSignature> findBySignataireIdOrderByCreeLeDesc(Long signataireId);

    List<DemandeSignature> findByUniversiteIdOrderByCreeLeDesc(Long universiteId);

    long countBySignataireIdAndStatut(Long signataireId, DemandeSignature.Statut statut);
}
