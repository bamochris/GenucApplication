package cd.genuc.repository;

import cd.genuc.model.CategorieOuvrage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategorieOuvrageRepository extends JpaRepository<CategorieOuvrage, Long> {

    List<CategorieOuvrage> findByUniversiteId(Long universiteId);

    List<CategorieOuvrage> findByUniversiteIdAndActifTrue(Long universiteId);
}