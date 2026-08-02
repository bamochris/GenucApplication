package cd.genuc.repository;

import cd.genuc.model.ChargeHoraire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChargeHoraireRepository extends JpaRepository<ChargeHoraire, Long> {

    List<ChargeHoraire> findByPersonnelId(Long personnelId);

    List<ChargeHoraire> findByCoursId(Long coursId);

    List<ChargeHoraire> findByPersonnelIdAndAnneeAcademique(Long personnelId, Integer annee);

    List<ChargeHoraire> findByCoursDepartementId(Long departementId);

    List<ChargeHoraire> findByPromotionId(Long promotionId);
}