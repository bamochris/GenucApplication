package cd.genuc.repository;

import cd.genuc.model.OffreStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OffreStageRepository extends JpaRepository<OffreStage, Long> {

    List<OffreStage> findByStatutOrderByDatePublicationDesc(OffreStage.StatutOffre statut);
}
