package cd.genuc.repository;

import cd.genuc.model.Paie;
import cd.genuc.model.Paie.StatutPaie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaieRepository extends JpaRepository<Paie, Long> {

    // ─── Recherches par personnel ──────────────────────────────
    List<Paie> findByPersonnelId(Long personnelId);

    // ✅ Nom de méthode corrigé
    List<Paie> findByPersonnelIdOrderByAnneeDescMoisDesc(Long personnelId);

    // ─── Recherches par mois et année ──────────────────────────
    List<Paie> findByMoisAndAnnee(String mois, Integer annee);

    List<Paie> findByPersonnelIdAndMoisAndAnnee(Long personnelId, String mois, Integer annee);

    // ─── Recherches par statut ──────────────────────────────────
    List<Paie> findByStatut(StatutPaie statut);

    List<Paie> findByPersonnelIdAndStatut(Long personnelId, StatutPaie statut);

    // ─── Recherches par université ─────────────────────────────
    @Query("SELECT p FROM Paie p WHERE p.personnel.universite.id = :universiteId")
    List<Paie> findByUniversiteId(@Param("universiteId") Long universiteId);

    // ✅ Correction du champ "universe" → "universite"
    @Query("SELECT p FROM Paie p WHERE p.personnel.universite.id = :universiteId AND p.statut = :statut")
    List<Paie> findByUniversiteIdAndStatut(@Param("universiteId") Long universiteId, @Param("statut") StatutPaie statut);

    // ─── Agrégations et sommes ──────────────────────────────────
    @Query("SELECT SUM(p.netAPayer) FROM Paie p WHERE p.personnel.universite.id = :universiteId AND p.mois = :mois AND p.annee = :annee")
    Double sumNetAPayerByUniversiteIdAndMois(@Param("universiteId") Long universiteId, @Param("mois") String mois, @Param("annee") Integer annee);

    @Query("SELECT SUM(p.netAPayer) FROM Paie p WHERE p.personnel.id = :personnelId AND p.mois = :mois AND p.annee = :annee")
    Double sumNetAPayerByPersonnelIdAndMois(@Param("personnelId") Long personnelId, @Param("mois") String mois, @Param("annee") Integer annee);

    @Query("SELECT COUNT(p) FROM Paie p WHERE p.personnel.universite.id = :universiteId AND p.statut = 'EN_ATTENTE'")
    long countEnAttenteByUniversite(@Param("universiteId") Long universiteId);

    // ─── Vérification d'existence ──────────────────────────────
    boolean existsByPersonnelIdAndMoisAndAnnee(Long personnelId, String mois, Integer annee);

    // ─── Recherche par numéro de bulletin ──────────────────────
    Optional<Paie> findByNumeroBulletin(String numeroBulletin);
}