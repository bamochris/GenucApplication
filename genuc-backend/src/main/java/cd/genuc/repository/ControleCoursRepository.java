package cd.genuc.repository;

import cd.genuc.model.ControleCours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ControleCoursRepository extends JpaRepository<ControleCours, Long> {

    Optional<ControleCours> findByCoursId(Long coursId);
}
