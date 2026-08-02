package cd.genuc.repository;

import cd.genuc.model.Depense;
import cd.genuc.model.Depense.CategorieDepense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DepenseRepository extends JpaRepository<Depense, Long> {

    // ─── Recherches par université ──────────────────────────────
    List<Depense> findByUniversiteId(Long universiteId);

    List<Depense> findByUniversiteIdOrderByDateDepenseDesc(Long universiteId);

    // ─── Recherches par date ─────────────────────────────────────
    List<Depense> findByDateDepense(LocalDate date);

    List<Depense> findByDateDepenseBetween(LocalDate debut, LocalDate fin);

    List<Depense> findByUniversiteIdAndDateDepenseBetween(Long universiteId, LocalDate debut, LocalDate fin);

    // ─── Recherches par catégorie ────────────────────────────────
    List<Depense> findByCategorie(CategorieDepense categorie);

    List<Depense> findByUniversiteIdAndCategorie(Long universiteId, CategorieDepense categorie);

    // ─── Agrégations ──────────────────────────────────────────────

    @Query("SELECT SUM(d.montant) FROM Depense d WHERE d.universite.id = :universiteId AND d.dateDepense = :date")
    Double sumByUniversiteIdAndDate(@Param("universiteId") Long universiteId, @Param("date") LocalDate date);

    @Query("SELECT SUM(d.montant) FROM Depense d WHERE d.universite.id = :universiteId AND d.dateDepense BETWEEN :debut AND :fin")
    Double sumByUniversiteIdAndDateBetween(@Param("universiteId") Long universiteId,
                                           @Param("debut") LocalDate debut,
                                           @Param("fin") LocalDate fin);

    @Query("SELECT SUM(d.montant) FROM Depense d WHERE d.categorie = :categorie AND d.universite.id = :universiteId")
    Double sumByCategorieAndUniversite(@Param("categorie") CategorieDepense categorie,
                                       @Param("universiteId") Long universiteId);

    // ─── Statistiques ─────────────────────────────────────────────

    @Query("SELECT COUNT(d) FROM Depense d WHERE d.universite.id = :universiteId")
    long countByUniversiteId(@Param("universiteId") Long universiteId);

    @Query("SELECT d.categorie, SUM(d.montant) FROM Depense d WHERE d.universite.id = :universiteId GROUP BY d.categorie")
    List<Object[]> sumByCategorieGroupByUniversite(@Param("universiteId") Long universiteId);

    // ─── Vérification d'existence ─────────────────────────────────

    boolean existsByUniversiteIdAndLibelle(Long universiteId, String libelle);
}