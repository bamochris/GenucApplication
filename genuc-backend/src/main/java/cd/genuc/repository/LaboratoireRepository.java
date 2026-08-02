package cd.genuc.repository;

import cd.genuc.model.Laboratoire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LaboratoireRepository extends JpaRepository<Laboratoire, Long> {

    List<Laboratoire> findByProfesseurIdOrderByCreeLeDesc(Long professeurId);
}
