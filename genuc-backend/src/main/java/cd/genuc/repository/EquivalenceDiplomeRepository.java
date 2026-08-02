package cd.genuc.repository;

import cd.genuc.model.EquivalenceDiplome;
import cd.genuc.model.EquivalenceDiplome.StatutEquivalence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquivalenceDiplomeRepository extends JpaRepository<EquivalenceDiplome, Long> {

    List<EquivalenceDiplome> findByEtudiantIdOrderByDateSoumissionDesc(Long etudiantId);

    List<EquivalenceDiplome> findByUniversiteIdOrderByDateSoumissionDesc(Long universiteId);

    List<EquivalenceDiplome> findByUniversiteIdAndStatutOrderByDateSoumissionDesc(Long universiteId, StatutEquivalence statut);
}
