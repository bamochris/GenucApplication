package cd.genuc.repository;

import cd.genuc.model.TypeVacation;
import cd.genuc.model.Vacation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VacationRepository extends JpaRepository<Vacation, Long> {

    List<Vacation> findByUniversiteId(Long universiteId);

    List<Vacation> findByUniversiteIdAndType(Long universiteId, TypeVacation type);

    List<Vacation> findByUniversiteIdAndActifTrue(Long universiteId);

    List<Vacation> findByAnneeAcademiqueId(Long anneeAcademiqueId);

    Optional<Vacation> findByUniversiteIdAndTypeAndAnneeAcademiqueId(
            Long universiteId, TypeVacation type, Long anneeAcademiqueId);

    @Query("SELECT v FROM Vacation v WHERE v.universite.id = :universiteId " +
            "AND v.inscriptionsOuvertes = true AND v.actif = true " +
            "AND v.dateDebut <= :date AND v.dateFin >= :date")
    List<Vacation> findInscriptionsOuvertes(@Param("universiteId") Long universiteId,
            @Param("date") LocalDate date);

    List<Vacation> findByTypeAndActifTrue(TypeVacation type);
}
