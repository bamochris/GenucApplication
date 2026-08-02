package cd.genuc.repository;

import cd.genuc.model.CandidatureStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatureStageRepository extends JpaRepository<CandidatureStage, Long> {

    List<CandidatureStage> findByInscriptionId(Long inscriptionId);

    List<CandidatureStage> findByOffreId(Long offreId);

    Optional<CandidatureStage> findByOffreIdAndInscriptionId(Long offreId, Long inscriptionId);

    boolean existsByOffreIdAndInscriptionId(Long offreId, Long inscriptionId);
}
