package cd.genuc.repository;

import cd.genuc.model.Presence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PresenceRepository extends JpaRepository<Presence, Long> {

    List<Presence> findByCoursIdAndDateCours(Long coursId, LocalDate date);

    List<Presence> findByEtudiantIdAndCoursId(Long etudiantId, Long coursId);

    Optional<Presence> findByEtudiantIdAndCoursIdAndDateCours(Long etudiantId, Long coursId, LocalDate date);

    @Query("SELECT COUNT(p) FROM Presence p WHERE p.cours.id = :coursId AND p.dateCours = :date AND p.present = true")
    long countPresentByCoursAndDate(@Param("coursId") Long coursId, @Param("date") LocalDate date);

    @Query("SELECT p.etudiant.id FROM Presence p WHERE p.cours.id = :coursId AND p.dateCours = :date AND p.present = true")
    List<Long> findEtudiantIdsPresentByCoursAndDate(@Param("coursId") Long coursId, @Param("date") LocalDate date);

    // ✅ Corrigé : utilisation de dateCours au lieu de date
    @Query("SELECT COUNT(p) FROM Presence p WHERE p.etudiant.id = :etudiantId AND p.dateCours = :date")
    int countByEtudiantIdAndDate(@Param("etudiantId") Long etudiantId, @Param("date") LocalDate date);

    List<Presence> findByCoursIdAndDateCoursBetween(Long coursId, LocalDate debut, LocalDate fin);

    boolean existsByCoursIdAndEtudiantIdAndDateCours(Long coursId, Long etudiantId, LocalDate date);

    List<Presence> findByEtudiantId(Long etudiantId);

    List<Presence> findByCoursId(Long coursId);

    @Query("SELECT COUNT(p) FROM Presence p WHERE p.cours.professeurId = :professeurId")
    long countByProfesseurId(@Param("professeurId") Long professeurId);

    @Query("SELECT COUNT(p) FROM Presence p WHERE p.cours.professeurId = :professeurId AND p.present = true")
    long countPresentByProfesseurId(@Param("professeurId") Long professeurId);
}