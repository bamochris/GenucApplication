package cd.genuc.repository;

import cd.genuc.model.TravauxDevoir;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TravauxDevoirRepository extends JpaRepository<TravauxDevoir, Long> {

    List<TravauxDevoir> findByProfesseurIdOrderByCreeLeDesc(Long professeurId);

    List<TravauxDevoir> findByCoursIdOrderByCreeLeDesc(Long coursId);

    @Query("SELECT t FROM TravauxDevoir t WHERE t.cours.universite.id = :universiteId AND t.annule = false ORDER BY t.dateEcheance DESC")
    List<TravauxDevoir> findByUniversiteId(@Param("universiteId") Long universiteId);

    @Query("SELECT t FROM TravauxDevoir t WHERE t.cours.id IN :coursIds AND t.annule = false ORDER BY t.dateEcheance DESC")
    List<TravauxDevoir> findByCoursIdIn(@Param("coursIds") List<Long> coursIds);
}
