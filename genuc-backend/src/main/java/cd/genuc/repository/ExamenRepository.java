package cd.genuc.repository;

import cd.genuc.model.Examen;
import cd.genuc.model.Examen.StatutExamen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExamenRepository extends JpaRepository<Examen, Long> {

    List<Examen> findByUniversiteIdAndAnneeAcademiqueOrderByDateAsc(
        Long universiteId, String annee
    );

    List<Examen> findByDepartementIdAndAnneeAcademiqueOrderByDateAsc(
        Long departementId, String annee
    );

    List<Examen> findByCoursId(Long coursId);

    List<Examen> findByUniversiteIdAndStatut(Long universiteId, StatutExamen statut);

    // ── Module Évaluations (professeur) ─────────────────────────
    List<Examen> findByProfesseurIdAndTypeOrderByDateDesc(
        Long professeurId, Examen.TypeExamen type
    );

    List<Examen> findByProfesseurIdAndTypeInOrderByDateDesc(
        Long professeurId, List<Examen.TypeExamen> types
    );

    List<Examen> findByUniversiteIdAndDateBetween(
        Long universiteId, LocalDate debut, LocalDate fin
    );

    @Query("SELECT e FROM Examen e WHERE e.universite.id = :uniId " +
           "AND e.date >= :today AND e.statut = 'PLANIFIE' ORDER BY e.date ASC")
    List<Examen> prochains(Long uniId, LocalDate today);

    @Query("SELECT e FROM Examen e WHERE e.date = :today AND e.statut = 'PLANIFIE'")
    List<Examen> examensAujourdhui(LocalDate today);
}
