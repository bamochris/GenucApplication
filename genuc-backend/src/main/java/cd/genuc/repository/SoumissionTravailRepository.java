package cd.genuc.repository;

import cd.genuc.model.SoumissionTravail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SoumissionTravailRepository extends JpaRepository<SoumissionTravail, Long> {

    List<SoumissionTravail> findByTravailId(Long travailId);

    List<SoumissionTravail> findByInscriptionId(Long inscriptionId);

    Optional<SoumissionTravail> findByTravailIdAndInscriptionId(Long travailId, Long inscriptionId);

    /** Contrôle d'accès : retrouve le dépôt propriétaire d'un fichier. */
    List<SoumissionTravail> findByFichierUrl(String fichierUrl);
}
