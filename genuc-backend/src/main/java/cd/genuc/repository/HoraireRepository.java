package cd.genuc.repository;

import cd.genuc.model.Horaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface HoraireRepository extends JpaRepository<Horaire, Long> {
    List<Horaire> findByCoursId(Long coursId);
    List<Horaire> findBySalleId(Long salleId);
    List<Horaire> findByPromotionLibelle(String promotion);

    // Variantes cloisonnées par établissement : un libellé de promotion (« L1 », « G2 »…)
    // est commun à toutes les universités, filtrer dessus seul expose l'emploi du temps
    // des autres établissements.
    List<Horaire> findByUniversiteIdAndPromotionLibelle(Long universiteId, String promotion);
    List<Horaire> findByUniversiteIdAndSalleId(Long universiteId, Long salleId);

    @Query("SELECT h FROM Horaire h WHERE h.salle.id = :salleId AND h.jour = :jour " +
           "AND ((h.heureDebut < :fin AND h.heureFin > :debut))")
    List<Horaire> findConflitsSalle(Long salleId, DayOfWeek jour, LocalTime debut, LocalTime fin);

    @Query("SELECT h FROM Horaire h WHERE h.universiteId = :uniId AND h.jour = :jour")
    List<Horaire> findByUniversiteIdAndJour(Long uniId, DayOfWeek jour);

    @Query("SELECT h FROM Horaire h WHERE h.cours.professeurId = :professeurId AND h.jour = :jour ORDER BY h.heureDebut")
    List<Horaire> findByProfesseurIdAndJour(Long professeurId, DayOfWeek jour);
}