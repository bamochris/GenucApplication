package cd.genuc.repository;

import cd.genuc.model.SupportCours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportCoursRepository extends JpaRepository<SupportCours, Long> {

    List<SupportCours> findByCoursIdOrderByCreeLeDesc(Long coursId);

    long countByCoursId(Long coursId);
}
