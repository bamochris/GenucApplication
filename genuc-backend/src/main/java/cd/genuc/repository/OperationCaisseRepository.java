package cd.genuc.repository;

import cd.genuc.model.OperationCaisse;
import cd.genuc.model.OperationCaisse.TypeOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OperationCaisseRepository extends JpaRepository<OperationCaisse, Long> {

    List<OperationCaisse> findByCaisseIdOrderByDateOperationDesc(Long caisseId);

    List<OperationCaisse> findByCaisseIdAndTypeOrderByDateOperationDesc(Long caisseId, TypeOperation type);

    List<OperationCaisse> findByCaisseIdAndDateOperationBetweenOrderByDateOperationDesc(
            Long caisseId, LocalDateTime debut, LocalDateTime fin);

    @Query("SELECT SUM(o.montant) FROM OperationCaisse o WHERE o.caisse.id = :caisseId AND o.type = 'ENCAISSEMENT'")
    Double sumEncaissementsByCaisse(Long caisseId);

    @Query("SELECT SUM(o.montant) FROM OperationCaisse o WHERE o.caisse.id = :caisseId AND o.type IN ('DEPENSE', 'REMBOURSEMENT')")
    Double sumSortiesByCaisse(Long caisseId);
}