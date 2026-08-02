package cd.genuc.repository;

import cd.genuc.model.PresencePersonnel;
import cd.genuc.model.PresencePersonnel.StatutPresence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PresencePersonnelRepository extends JpaRepository<PresencePersonnel, Long> {

    List<PresencePersonnel> findByPersonnelId(Long personnelId);

    List<PresencePersonnel> findByPersonnelIdAndDatePresenceBetween(Long personnelId, LocalDate debut, LocalDate fin);

    List<PresencePersonnel> findByPersonnelIdAndDatePresence(Long personnelId, LocalDate date);

    @Query("SELECT COUNT(p) FROM PresencePersonnel p WHERE p.personnel.id = :personnelId AND p.datePresence = :date AND p.statut = 'PRESENT'")
    long countPresentByPersonnelAndDate(Long personnelId, LocalDate date);
}