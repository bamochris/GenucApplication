package cd.genuc.repository;

import cd.genuc.model.EvenementParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EvenementParticipantRepository extends JpaRepository<EvenementParticipant, Long> {

    long countByEvenementId(Long evenementId);

    boolean existsByEvenementIdAndInscriptionId(Long evenementId, Long inscriptionId);
}
