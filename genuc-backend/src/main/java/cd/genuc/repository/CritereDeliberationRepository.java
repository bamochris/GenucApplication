package cd.genuc.repository;

import cd.genuc.model.CritereDeliberation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CritereDeliberationRepository extends JpaRepository<CritereDeliberation, Long> {

    Optional<CritereDeliberation> findByPromotionIdAndAnneeAcademiqueId(Long promotionId, Long anneeAcademiqueId);

    Optional<CritereDeliberation> findByPromotionIdAndAnneeAcademiqueIdAndActifTrue(Long promotionId, Long anneeAcademiqueId);
}