package cd.genuc.repository;

import cd.genuc.model.ProgressionEtudiant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProgressionEtudiantRepository extends JpaRepository<ProgressionEtudiant, Long> {

    Optional<ProgressionEtudiant> findByInscriptionIdAndCoursId(Long inscriptionId, Long coursId);

    List<ProgressionEtudiant> findByInscriptionId(Long inscriptionId);

    List<ProgressionEtudiant> findByCoursId(Long coursId);

    @Query("SELECT p FROM ProgressionEtudiant p WHERE p.inscription.id = :inscriptionId " +
           "AND p.coursComplete = true")
    List<ProgressionEtudiant> coursCompletes(Long inscriptionId);

    @Query("SELECT COUNT(p) FROM ProgressionEtudiant p " +
           "WHERE p.cours.id = :coursId AND p.coursComplete = true")
    long countEtudiantsAyantComplete(Long coursId);

    @Query("SELECT AVG(p.pourcentageCompletion) FROM ProgressionEtudiant p " +
           "WHERE p.cours.id = :coursId")
    Double moyenneProgressionCours(Long coursId);
}
