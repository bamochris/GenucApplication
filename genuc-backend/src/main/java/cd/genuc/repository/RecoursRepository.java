package cd.genuc.repository;

import cd.genuc.model.Recours;
import cd.genuc.model.Recours.StatutRecours;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecoursRepository extends JpaRepository<Recours, Long> {

    @EntityGraph(attributePaths = {"inscription", "cours"})
    List<Recours> findByInscriptionIdOrderByDateSoumissionDesc(Long inscriptionId);

    @EntityGraph(attributePaths = {"inscription", "cours"})
    @Query("SELECT r FROM Recours r WHERE r.inscription.universite.id = :universiteId ORDER BY r.dateSoumission DESC")
    List<Recours> findByUniversiteId(@Param("universiteId") Long universiteId);

    @EntityGraph(attributePaths = {"inscription", "cours"})
    @Query("SELECT r FROM Recours r WHERE r.inscription.universite.id = :universiteId AND r.statut = :statut ORDER BY r.dateSoumission DESC")
    List<Recours> findByUniversiteIdAndStatut(@Param("universiteId") Long universiteId, @Param("statut") StatutRecours statut);

    @EntityGraph(attributePaths = {"inscription", "cours"})
    @Query("SELECT r FROM Recours r WHERE r.inscription.departement.id = :departementId ORDER BY r.dateSoumission DESC")
    List<Recours> findByDepartementId(@Param("departementId") Long departementId);

    @EntityGraph(attributePaths = {"inscription", "cours"})
    @Query("SELECT r FROM Recours r WHERE r.inscription.departement.id = :departementId AND r.statut = :statut ORDER BY r.dateSoumission DESC")
    List<Recours> findByDepartementIdAndStatut(@Param("departementId") Long departementId, @Param("statut") StatutRecours statut);

    /** Contrôle d'accès : retrouve le recours propriétaire d'une pièce jointe. */
    List<Recours> findByPieceJointeUrl(String pieceJointeUrl);
}
