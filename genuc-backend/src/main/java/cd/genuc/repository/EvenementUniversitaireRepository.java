package cd.genuc.repository;

import cd.genuc.model.EvenementUniversitaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvenementUniversitaireRepository extends JpaRepository<EvenementUniversitaire, Long> {

    List<EvenementUniversitaire> findByUniversiteIdOrderByDateAsc(Long universiteId);
}
