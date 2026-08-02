package cd.genuc.repository;

import cd.genuc.model.CandidatureBourse;
import cd.genuc.model.CandidatureBourse.StatutCandidature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatureBourseRepository extends JpaRepository<CandidatureBourse, Long> {

    List<CandidatureBourse> findByEtudiantId(Long etudiantId);

    List<CandidatureBourse> findByBourseOffreId(Long bourseOffreId);

    List<CandidatureBourse> findByStatut(StatutCandidature statut);

    Optional<CandidatureBourse> findByBourseOffreIdAndEtudiantId(Long bourseOffreId, Long etudiantId);

    boolean existsByBourseOffreIdAndEtudiantId(Long bourseOffreId, Long etudiantId);

    @Query("SELECT c FROM CandidatureBourse c WHERE c.bourseOffre.universite.id = :universiteId ORDER BY c.dateDemande DESC")
    List<CandidatureBourse> findByUniversiteId(@Param("universiteId") Long universiteId);

    /** Contrôle d'accès : retrouve la candidature propriétaire d'une pièce justificative. */
    List<CandidatureBourse> findByPieceJustificativeUrl(String pieceJustificativeUrl);
}
