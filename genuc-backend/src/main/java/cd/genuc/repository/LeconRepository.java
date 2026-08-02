package cd.genuc.repository;

import cd.genuc.model.Lecon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeconRepository extends JpaRepository<Lecon, Long> {
    List<Lecon> findByCoursIdOrderByOrdreAsc(Long coursId);
    List<Lecon> findByCoursIdAndActifTrue(Long coursId);
    long countByCoursId(Long coursId);
}
