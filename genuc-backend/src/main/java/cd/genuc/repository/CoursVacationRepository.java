package cd.genuc.repository;

import cd.genuc.model.CoursVacation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoursVacationRepository extends JpaRepository<CoursVacation, Long> {

    List<CoursVacation> findByVacationId(Long vacationId);

    List<CoursVacation> findByProfesseurId(Long professeurId);

    List<CoursVacation> findByVacationIdAndPromotionId(Long vacationId, Long promotionId);

    List<CoursVacation> findByProfesseurIdAndVacationAnneeAcademiqueId(Long professeurId, Long anneeAcademiqueId);

    List<CoursVacation> findByVacationIdAndActifTrue(Long vacationId);
}
