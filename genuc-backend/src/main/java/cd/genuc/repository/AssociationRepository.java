package cd.genuc.repository;

import cd.genuc.model.Association;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssociationRepository extends JpaRepository<Association, Long> {

    List<Association> findByUniversiteIdAndActifTrueOrderByNomAsc(Long universiteId);
}
