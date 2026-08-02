package cd.genuc.repository;

import cd.genuc.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    List<Promotion> findByFiliereId(Long filiereId);

    List<Promotion> findByFiliereIdAndAnneeAcademiqueId(Long filiereId, Long anneeAcademiqueId);

    Promotion findByFiliereIdAndLibelle(Long filiereId, String libelle);

    // ✅ Méthode corrigée : le chemin correct est p.filiere.departement.faculte.universite.id
    @Query("SELECT p FROM Promotion p WHERE p.filiere.departement.faculte.universite.id = :universiteId")
    List<Promotion> findByFiliereDepartementUniversiteId(@Param("universiteId") Long universiteId);
}