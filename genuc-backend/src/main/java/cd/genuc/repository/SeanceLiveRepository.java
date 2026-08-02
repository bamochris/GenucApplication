package cd.genuc.repository;

import cd.genuc.model.SeanceLive;
import cd.genuc.model.SeanceLive.StatutSeance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SeanceLiveRepository extends JpaRepository<SeanceLive, Long> {

    List<SeanceLive> findByCoursId(Long coursId);

    List<SeanceLive> findByProfesseurId(Long professeurId);

    List<SeanceLive> findByStatut(StatutSeance statut);

    @Query("SELECT s FROM SeanceLive s WHERE s.cours.universite.id = :uniId " +
           "AND s.dateDebut > :maintenant AND s.statut = 'PLANIFIEE' " +
           "ORDER BY s.dateDebut ASC")
    List<SeanceLive> prochainesSeances(Long uniId, LocalDateTime maintenant);

    @Query("SELECT s FROM SeanceLive s WHERE s.cours.departement.id = :deptId " +
           "AND s.dateDebut > :maintenant AND s.statut = 'PLANIFIEE' " +
           "ORDER BY s.dateDebut ASC")
    List<SeanceLive> prochainesSeancesParDept(Long deptId, LocalDateTime maintenant);

    @Query("SELECT s FROM SeanceLive s WHERE s.statut = 'EN_COURS'")
    List<SeanceLive> seancesEnCours();
}
