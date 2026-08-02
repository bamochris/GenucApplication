// src/main/java/cd/genuc/repository/FraisRepository.java
package cd.genuc.repository;

import cd.genuc.model.Frais;
import cd.genuc.model.Frais.StatutFrais;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FraisRepository extends JpaRepository<Frais, Long> {

    List<Frais> findByUniversiteId(Long universiteId);

    List<Frais> findByUniversiteIdAndAnneeAcademique(Long universiteId, String anneeAcademique);

    List<Frais> findByUniversiteIdAndStatut(Long universiteId, StatutFrais statut);

    List<Frais> findByPromotionId(Long promotionId);

    @Query("SELECT f FROM Frais f WHERE f.universite.id = :uniId AND f.anneeAcademique = :annee AND f.statut = 'ACTIF'")
    List<Frais> findActifsByUniversiteAndAnnee(@Param("uniId") Long universiteId, @Param("annee") String annee);

    @Query("SELECT f FROM Frais f WHERE f.promotionId = :promotionId AND f.anneeAcademique = :annee AND f.statut = 'ACTIF'")
    List<Frais> findActifsByPromotionAndAnnee(@Param("promotionId") Long promotionId, @Param("annee") String annee);

    boolean existsByCodeAndUniversiteId(String code, Long universiteId);
}