package cd.genuc.repository;

import cd.genuc.model.Publication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PublicationRepository extends JpaRepository<Publication, Long> {

    List<Publication> findByProfesseurIdOrderByAnneeDescCreeLeDesc(Long professeurId);
}
