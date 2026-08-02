package cd.genuc.repository;

import cd.genuc.model.ChapitreTfc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapitreTfcRepository extends JpaRepository<ChapitreTfc, Long> {

    List<ChapitreTfc> findByTfcIdOrderByOrdreAsc(Long tfcId);

    /** Contrôle d'accès : retrouve le chapitre propriétaire d'un fichier déposé. */
    List<ChapitreTfc> findByUrl(String url);
}
