package cd.genuc.repository;

import cd.genuc.model.Filiere;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FiliereRepository extends JpaRepository<Filiere, Long> {

    List<Filiere> findByDepartementId(Long departementId);

    List<Filiere> findByDepartementIdAndActifTrue(Long departementId);

    Optional<Filiere> findByNomAndDepartementId(String nom, Long departementId);

    boolean existsByNomAndDepartementId(String nom, Long departementId);

    @Query("SELECT COUNT(f) FROM Filiere f WHERE f.departement.id = :departementId AND f.actif = true")
    long countByDepartementIdAndActifTrue(@Param("departementId") Long departementId);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.filiere.id = :filiereId AND (i.statut = 'VALIDE' OR i.statut = 'VALIDEE')")
    long countEtudiantsByFiliere(@Param("filiereId") Long filiereId);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.departement.id = :departementId AND (i.statut = 'VALIDE' OR i.statut = 'VALIDEE')")
    long countEtudiantsByDepartement(@Param("departementId") Long departementId);

    // ✅ CORRECTION : le chemin correct est f.departement.faculte.universite
    @Query("SELECT f FROM Filiere f " +
           "WHERE f.departement.faculte.universite.id = :universiteId " +
           "AND f.departement.faculte.universite.actif = true " +
           "AND f.departement.faculte.universite.inscriptionsOuvertes = true " +
           "AND f.departement.actif = true " +
           "AND f.actif = true " +
           "AND f.inscriptionsOuvertes = true")
    List<Filiere> findDisponiblesParUniversite(@Param("universiteId") Long universiteId);

    // Toutes les filières d'une université (actives ou non), pour la gestion
    // interne de l'exigence du test d'admission par le secrétariat / l'admin.
    @Query("SELECT f FROM Filiere f " +
           "WHERE f.departement.universite.id = :universiteId " +
           "ORDER BY f.departement.nom, f.nom")
    List<Filiere> findByUniversiteId(@Param("universiteId") Long universiteId);
}