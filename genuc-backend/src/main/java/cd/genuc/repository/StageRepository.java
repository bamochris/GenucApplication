package cd.genuc.repository;

import cd.genuc.model.Stage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StageRepository extends JpaRepository<Stage, Long> {

    Optional<Stage> findFirstByInscriptionIdOrderByDateCreationDesc(Long inscriptionId);

    List<Stage> findByInscriptionId(Long inscriptionId);

    List<Stage> findByStatutOrderByDateCreationDesc(Stage.StatutStage statut);

    List<Stage> findByStatutInOrderByDateCreationDesc(List<Stage.StatutStage> statuts);

    List<Stage> findByRapportUrlIsNotNullOrderByRapportDateDesc();

    List<Stage> findAllByOrderByDateCreationDesc();

    /** Contrôle d'accès : retrouve le stage propriétaire d'une convention ou d'un rapport. */
    List<Stage> findByConventionUrlOrRapportUrl(String conventionUrl, String rapportUrl);
}
