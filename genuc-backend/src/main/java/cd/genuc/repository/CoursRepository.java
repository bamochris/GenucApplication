package cd.genuc.repository;

import cd.genuc.model.Cours;
import cd.genuc.model.Cours.StatutCours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoursRepository extends JpaRepository<Cours, Long> {

    List<Cours> findByUniversiteId(Long universiteId);

    List<Cours> findByDepartementId(Long departementId);

    List<Cours> findByUniversiteIdAndStatut(Long universiteId, StatutCours statut);

    List<Cours> findByProfesseurId(Long professeurId);

    List<Cours> findByUniversiteIdAndNiveauAndStatut(Long universiteId, String niveau, StatutCours statut);

    Optional<Cours> findByCodeAndUniversiteId(String code, Long universiteId);

    boolean existsByCodeAndUniversiteId(String code, Long universiteId);

    @Query("SELECT c FROM Cours c WHERE c.universite.id = :uniId " +
           "AND c.statut = 'PUBLIE' ORDER BY c.publieLe DESC")
    List<Cours> findPubliesParUniversite(@Param("uniId") Long uniId);

    @Query("SELECT c FROM Cours c WHERE c.departement.id = :deptId " +
           "AND c.statut = 'PUBLIE' AND c.niveau = :niveau")
    List<Cours> findPubliesParDepartementEtNiveau(@Param("deptId") Long deptId, @Param("niveau") String niveau);

    // ✅ UNIQUE méthode countPubliesParUniversite (l'autre a été supprimée)
    @Query("SELECT COUNT(c) FROM Cours c WHERE c.universite.id = :uniId AND c.statut = 'PUBLIE'")
    long countPubliesParUniversite(@Param("uniId") Long uniId);

    // Méthode existante pour les départements
    List<Cours> findByDepartementIdAndStatut(Long departementId, StatutCours publie);
}