package cd.genuc.repository;

import cd.genuc.model.SujetTfc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SujetTfcRepository extends JpaRepository<SujetTfc, Long> {

    List<SujetTfc> findByProfesseurIdOrderByDateCreationDesc(Long professeurId);

    List<SujetTfc> findByStatutOrderByDateCreationDesc(SujetTfc.StatutSujet statut);
}
