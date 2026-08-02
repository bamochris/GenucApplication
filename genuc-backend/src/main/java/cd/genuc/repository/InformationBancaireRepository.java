package cd.genuc.repository;

import cd.genuc.model.InformationBancaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InformationBancaireRepository extends JpaRepository<InformationBancaire, Long> {

    List<InformationBancaire> findByUniversiteIdAndActifTrue(Long universiteId);

    List<InformationBancaire> findByUniversiteId(Long universiteId);
}
