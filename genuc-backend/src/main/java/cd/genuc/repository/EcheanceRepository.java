package cd.genuc.repository;

import cd.genuc.model.Echeance;
import cd.genuc.model.Echeance.StatutEcheance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface EcheanceRepository extends JpaRepository<Echeance, Long> {

    List<Echeance> findByEcheancierId(Long echeancierId);

    List<Echeance> findByEcheancierIdOrderByNumeroEcheanceAsc(Long echeancierId);

    List<Echeance> findByStatut(StatutEcheance statut);

    @Query("SELECT e FROM Echeance e WHERE e.dateEcheance < :date AND e.statut NOT IN ('PAYEE', 'ANNULEE')")
    List<Echeance> findEcheancesEnRetard(LocalDate date);

    @Query("SELECT e FROM Echeance e WHERE e.echeancier.universite.id = :universiteId " +
           "AND e.dateEcheance < :date AND e.statut NOT IN ('PAYEE', 'ANNULEE') " +
           "ORDER BY e.dateEcheance ASC")
    List<Echeance> findARecouvrerParUniversite(Long universiteId, LocalDate date);

    @Query("SELECT e FROM Echeance e WHERE e.echeancier.inscription.id = :inscriptionId AND e.statut = 'EN_ATTENTE'")
    List<Echeance> findEnAttenteParInscription(Long inscriptionId);

    @Query("SELECT COUNT(e) FROM Echeance e WHERE e.echeancier.inscription.id = :inscriptionId AND e.statut = 'PAYEE'")
    long countPayeesParInscription(Long inscriptionId);
}