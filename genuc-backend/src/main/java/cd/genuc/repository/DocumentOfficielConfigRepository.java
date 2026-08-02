package cd.genuc.repository;

import cd.genuc.model.DocumentOfficielConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentOfficielConfigRepository extends JpaRepository<DocumentOfficielConfig, Long> {

    List<DocumentOfficielConfig> findByUniversiteIdOrderByOrdreAffichageAscLibelleAsc(Long universiteId);

    List<DocumentOfficielConfig> findByUniversiteIdAndActifTrueOrderByOrdreAffichageAscLibelleAsc(Long universiteId);

    Optional<DocumentOfficielConfig> findByUniversiteIdAndCodeIgnoreCase(Long universiteId, String code);
}