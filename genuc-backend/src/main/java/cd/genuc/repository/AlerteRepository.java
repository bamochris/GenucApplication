package cd.genuc.repository;

import cd.genuc.model.Alerte;
import cd.genuc.model.Alerte.NiveauAlerte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlerteRepository extends JpaRepository<Alerte, Long> {

    List<Alerte> findByUniversiteIdOrderByCreeLeDesc(Long universiteId);

    List<Alerte> findByUniversiteIdAndVueFalseOrderByCreeLeDesc(Long universiteId);

    List<Alerte> findByNiveauOrderByCreeLeDesc(NiveauAlerte niveau);

    @Query("SELECT a FROM Alerte a WHERE a.vue = false ORDER BY a.niveau DESC, a.creeLe DESC")
    List<Alerte> findNonVuesParOrdrePriorite();

    long countByUniversiteIdAndVueFalse(Long universiteId);

    @Query("SELECT COUNT(a) FROM Alerte a WHERE a.vue = false AND a.niveau = 'CRITICAL'")
    long countNonVuesCritiques();
}