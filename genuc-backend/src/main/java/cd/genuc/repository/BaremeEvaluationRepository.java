package cd.genuc.repository;

import cd.genuc.model.BaremeEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BaremeEvaluationRepository extends JpaRepository<BaremeEvaluation, Long> {

    List<BaremeEvaluation> findByProfesseurIdOrderByCreeLeDesc(Long professeurId);

    List<BaremeEvaluation> findByCoursIdOrderByCreeLeDesc(Long coursId);

    Optional<BaremeEvaluation> findFirstByCoursIdOrderByModifieLeDesc(Long coursId);
}
