package cd.genuc.repository;

import cd.genuc.model.Conference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConferenceRepository extends JpaRepository<Conference, Long> {

    List<Conference> findByProfesseurIdOrderByDateDescCreeLeDesc(Long professeurId);
}
