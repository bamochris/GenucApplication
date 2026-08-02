package cd.genuc.repository;

import cd.genuc.model.LettreAcceptation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LettreAcceptationRepository extends JpaRepository<LettreAcceptation, Long> {

    Optional<LettreAcceptation> findByNumeroLettre(String numeroLettre);

    Optional<LettreAcceptation> findByUuidVerification(String uuidVerification);

    List<LettreAcceptation> findByEtudiantIdOrderByDateEmissionDesc(Long etudiantId);

    List<LettreAcceptation> findByUniversiteIdOrderByDateEmissionDesc(Long universiteId);

    List<LettreAcceptation> findByVacationIdOrderByDateEmissionDesc(Long vacationId);

    List<LettreAcceptation> findByInscriptionVacationId(Long inscriptionVacationId);

    List<LettreAcceptation> findByEtudiantIdAndEmiseTrue(Long etudiantId);

    List<LettreAcceptation> findByUniversiteIdAndEmiseTrue(Long universiteId);

    boolean existsByInscriptionVacationId(Long inscriptionVacationId);
}
