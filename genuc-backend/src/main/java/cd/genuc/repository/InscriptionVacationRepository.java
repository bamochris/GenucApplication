package cd.genuc.repository;

import cd.genuc.model.InscriptionVacation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionVacationRepository extends JpaRepository<InscriptionVacation, Long> {

    List<InscriptionVacation> findByVacationId(Long vacationId);

    List<InscriptionVacation> findByEtudiantId(Long etudiantId);

    List<InscriptionVacation> findByVacationIdAndStatut(Long vacationId, String statut);

    Optional<InscriptionVacation> findByVacationIdAndEtudiantId(Long vacationId, Long etudiantId);

    long countByVacationId(Long vacationId);

    boolean existsByVacationIdAndEtudiantId(Long vacationId, Long etudiantId);

    List<InscriptionVacation> findByEtudiantIdAndAnneeAcademiqueId(Long etudiantId, Long anneeAcademiqueId);
}
