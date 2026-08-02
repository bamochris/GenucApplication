package cd.genuc.repository;

import cd.genuc.model.MigrationLigne;
import cd.genuc.model.MigrationLigne.StatutLigne;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MigrationLigneRepository extends JpaRepository<MigrationLigne, Long> {

    Page<MigrationLigne> findByMigrationIdOrderByNumeroLigne(Long migrationId, Pageable pageable);

    Page<MigrationLigne> findByMigrationIdAndStatutOrderByNumeroLigne(Long migrationId, StatutLigne statut, Pageable pageable);

    List<MigrationLigne> findByMigrationIdAndStatutInOrderByNumeroLigne(Long migrationId, List<StatutLigne> statuts);

    List<MigrationLigne> findByMigrationIdAndStatut(Long migrationId, StatutLigne statut);

    long countByMigrationIdAndStatut(Long migrationId, StatutLigne statut);

    long countByMigrationId(Long migrationId);

    void deleteByMigrationId(Long migrationId);
}
