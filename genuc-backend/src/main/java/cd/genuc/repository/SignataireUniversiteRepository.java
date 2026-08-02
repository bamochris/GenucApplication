package cd.genuc.repository;

import cd.genuc.model.SignataireUniversite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SignataireUniversiteRepository extends JpaRepository<SignataireUniversite, Long> {

    List<SignataireUniversite> findByUniversiteIdOrderByNomComplet(Long universiteId);

    List<SignataireUniversite> findByUniversiteIdAndActifTrueOrderByNomComplet(Long universiteId);

    java.util.Optional<SignataireUniversite> findFirstByUtilisateurIdAndActifTrue(Long utilisateurId);
}
