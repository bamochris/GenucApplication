package cd.genuc.repository;

import cd.genuc.model.ProjetRecherche;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjetRechercheRepository extends JpaRepository<ProjetRecherche, Long> {

    List<ProjetRecherche> findByProfesseurIdOrderByCreeLeDesc(Long professeurId);
}
