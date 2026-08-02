package cd.genuc.repository;

import cd.genuc.model.BourseOffre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BourseOffreRepository extends JpaRepository<BourseOffre, Long> {

    List<BourseOffre> findByActifTrue();

    List<BourseOffre> findByUniversiteIdAndActifTrue(Long universiteId);
}
