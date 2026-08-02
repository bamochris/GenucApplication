package cd.genuc.repository;

import cd.genuc.model.Universite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UniversiteRepository extends JpaRepository<Universite, Long> {

    // ─── Recherches de base ──────────────────────────────────────

    Optional<Universite> findByCode(String code);

    Optional<Universite> findByCodeAndActifTrue(String code);

    List<Universite> findByInscriptionsOuvertesTrue();

    List<Universite> findAllByActifTrue();

    long countByActifTrue();

    @Query("SELECT u FROM Universite u WHERE u.actif = true ORDER BY u.nom ASC")
    List<Universite> findAllActifesOrdered();

    boolean existsByCode(String code);

    // ─── Compteurs (JPQL — évite les colonnes inexistantes) ─────

    @Query("SELECT COUNT(DISTINCT i.etudiant.id) FROM Inscription i WHERE i.universite.id = :universiteId")
    long countEtudiantsValides(@Param("universiteId") Long universiteId);

    @Query("SELECT COUNT(d) FROM Departement d WHERE d.faculte.universite.id = :universiteId AND d.actif = true")
    long countDepartementsActifs(@Param("universiteId") Long universiteId);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.universite.id = :universiteId AND i.statut = cd.genuc.model.StatutInscription.EN_ATTENTE")
    long countInscriptionsEnAttente(@Param("universiteId") Long universiteId);

    // ─── Statistiques détaillées (requête native corrigée) ───────

    @Query(value = "SELECT u.id, u.nom, u.code, " +
                   "COUNT(DISTINCT d.id) AS nbDepartements, " +
                   "COUNT(DISTINCT i.id) AS nbInscriptions, " +
                   "COUNT(DISTINCT e.id) AS nbEtudiants " +
                   "FROM universites u " +
                   "LEFT JOIN facultes f ON u.id = f.universite_id " +
                   "LEFT JOIN departements d ON f.id = d.faculte_id " +
                   "LEFT JOIN inscriptions i ON u.id = i.universite_id " +
                   "LEFT JOIN etudiants e ON i.etudiant_id = e.id " +
                   "GROUP BY u.id, u.nom, u.code",
           nativeQuery = true)
    List<Object[]> getStatsAllUniversites();
}
