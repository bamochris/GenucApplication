package cd.genuc.repository;

import cd.genuc.model.Paiement;
import cd.genuc.model.Paiement.StatutPaiement;
import cd.genuc.model.Paiement.TypePaiement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    Optional<Paiement> findByReference(String reference);

    boolean existsByReference(String reference);

    List<Paiement> findByInscriptionId(Long inscriptionId);

    List<Paiement> findByInscriptionIdAndStatut(Long inscriptionId, StatutPaiement statut);

    List<Paiement> findByInscriptionIdAndTypeAndStatutIn(Long inscriptionId, TypePaiement type, List<StatutPaiement> statuts);

    List<Paiement> findByUniversiteId(Long universiteId);

    // ✅ Méthode paginée avec EntityGraph pour éviter N+1
    @EntityGraph(attributePaths = {"inscription", "universite", "affectations"})
    Page<Paiement> findByInscriptionId(Long inscriptionId, Pageable pageable);

    // ✅ Méthode paginée avec EntityGraph
    @EntityGraph(attributePaths = {"inscription", "universite", "affectations"})
    Page<Paiement> findByUniversiteId(Long universiteId, Pageable pageable);

    // ✅ Paginée avec statut (sans le "1" !)
    @EntityGraph(attributePaths = {"inscription", "universite"})
    Page<Paiement> findByUniversiteIdAndStatut(Long universiteId, StatutPaiement statut, Pageable pageable);

    List<Paiement> findByUniversiteIdAndStatut(Long universiteId, StatutPaiement statut);

    List<Paiement> findByAgentId(Long agentId);

    List<Paiement> findByUniversiteIdAndDatePaiementBetween(Long universiteId, LocalDate debut, LocalDate fin);

    @EntityGraph(attributePaths = {"inscription", "universite"})
    Page<Paiement> findByUniversiteIdAndDatePaiement(Long universiteId, LocalDate date, Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p " +
           "WHERE p.inscription.id = :inscriptionId AND p.statut = 'VALIDE'")
    Double totalValideParInscription(@Param("inscriptionId") Long inscriptionId);

    // Total global, limité aux universités actives (statistiques super admin)
    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p " +
           "WHERE p.statut = :statut AND p.universite.actif = true")
    Double totalParStatutUniversiteActive(@Param("statut") StatutPaiement statut);

    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p " +
           "WHERE p.universite.id = :universiteId " +
           "AND p.statut = 'VALIDE' " +
           "AND p.datePaiement BETWEEN :debut AND :fin")
    double totalCollecteParPeriode(@Param("universiteId") Long universiteId,
                                   @Param("debut") LocalDate debut,
                                   @Param("fin") LocalDate fin);

    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p " +
           "WHERE p.agentId = :agentId AND p.statut = 'VALIDE'")
    Double totalParAgent(@Param("agentId") Long agentId);

    @Query("SELECT COUNT(p) FROM Paiement p " +
           "WHERE p.universite.id = :universiteId AND p.statut = 'EN_ATTENTE'")
    long countEnAttente(@Param("universiteId") Long universiteId);

    @Query("SELECT p FROM Paiement p WHERE p.universite.id = :universiteId " +
           "AND p.datePaiement = :date ORDER BY p.creeLe DESC")
    List<Paiement> paiementsDuJour(@Param("universiteId") Long universiteId,
                                   @Param("date") LocalDate date);

    @Query("SELECT COUNT(p) FROM Paiement p WHERE EXTRACT(YEAR FROM p.creeLe) = :annee")
    long countParAnnee(@Param("annee") int annee);

    @Query(value = "SELECT EXTRACT(MONTH FROM COALESCE(date_validation, date_paiement)) as mois, " +
                   "SUM(montant) as total " +
                   "FROM paiements " +
                   "WHERE statut = 'VALIDE' " +
                   "AND EXTRACT(YEAR FROM COALESCE(date_validation, date_paiement)) = :annee " +
                   "GROUP BY mois ORDER BY mois", nativeQuery = true)
    List<Map<String, Object>> sumByMois(@Param("annee") int annee);

    long countByStatut(StatutPaiement statut);
}