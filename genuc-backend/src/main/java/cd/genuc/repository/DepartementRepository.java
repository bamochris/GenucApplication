package cd.genuc.repository;

import cd.genuc.model.Departement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartementRepository extends JpaRepository<Departement, Long> {

    // ─── Recherches par université via la faculte ──────────────
    @Query("SELECT d FROM Departement d WHERE d.faculte.universite.id = :universiteId")
    List<Departement> findByUniversiteId(@Param("universiteId") Long universiteId);

    @Query("SELECT d FROM Departement d WHERE d.faculte.universite.id = :universiteId AND d.actif = true")
    List<Departement> findByUniversiteIdAndActifTrue(@Param("universiteId") Long universiteId);

    // ✅ Méthode corrigée avec @Query explicite
    @Query("SELECT COUNT(d) > 0 FROM Departement d WHERE d.code = :code AND d.faculte.universite.id = :universiteId")
    boolean existsByCodeAndUniversiteId(@Param("code") String code, @Param("universiteId") Long universiteId);
    
    // ═════════════ NOUVELLES MÉTHODES ═════════════
    
    /**
     * Récupère tous les départements actifs
     */
    @Query("SELECT d FROM Departement d WHERE d.actif = true")
    List<Departement> findAllActifs();
    
    /**
     * Compte les départements actifs d'une université
     */
    @Query("SELECT COUNT(d) FROM Departement d WHERE d.faculte.universite.id = :universiteId AND d.actif = true")
    long countByUniversiteIdAndActifTrue(@Param("universiteId") Long universiteId);

    /**
     * Compte les départements actifs appartenant à une université active
     * (utilisé pour les statistiques globales du super admin).
     */
    @Query("SELECT COUNT(d) FROM Departement d WHERE d.universite.actif = true AND d.actif = true")
    long countActifsUniversiteActive();
    
    /**
     * Récupère les départements d'une université triés par nom
     */
    @Query("SELECT d FROM Departement d WHERE d.faculte.universite.id = :universiteId ORDER BY d.nom ASC")
    List<Departement> findByUniversiteIdOrderByNomAsc(@Param("universiteId") Long universiteId);
}