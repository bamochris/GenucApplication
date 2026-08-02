package cd.genuc.repository;

import cd.genuc.model.MigrationImport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MigrationImportRepository extends JpaRepository<MigrationImport, Long> {

    List<MigrationImport> findByUniversiteIdOrderByCreeLeDesc(Long universiteId);

    List<MigrationImport> findAllByOrderByCreeLeDesc();

    // Mapping mémorisé : dernière migration de la même université ayant un
    // mapping confirmé — réutilisé automatiquement à la prochaine migration.
    Optional<MigrationImport> findFirstByUniversiteIdAndMappingJsonIsNotNullOrderByCreeLeDesc(Long universiteId);
}
