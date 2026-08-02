package cd.genuc.repository;

import cd.genuc.model.EcritureComptable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EcritureComptableRepository extends JpaRepository<EcritureComptable, Long> {

    List<EcritureComptable> findByUniversiteIdAndDateEcritureBetween(Long universiteId, LocalDate debut, LocalDate fin);

    List<EcritureComptable> findByCompteDebitId(Long compteId);

    List<EcritureComptable> findByCompteCreditId(Long compteId);

    @Query("SELECT SUM(e.montant) FROM EcritureComptable e WHERE e.compteDebit.id = :compteId OR e.compteCredit.id = :compteId")
    Double sumMouvementsByCompte(Long compteId);
}