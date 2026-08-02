package cd.genuc.repository;

import cd.genuc.model.AssociationMembre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssociationMembreRepository extends JpaRepository<AssociationMembre, Long> {

    long countByAssociationId(Long associationId);

    Optional<AssociationMembre> findByAssociationIdAndInscriptionId(Long associationId, Long inscriptionId);

    boolean existsByAssociationIdAndInscriptionId(Long associationId, Long inscriptionId);

    @Query("SELECT am.association FROM AssociationMembre am WHERE am.inscription.id = :inscriptionId")
    List<cd.genuc.model.Association> findAssociationsByInscriptionId(@Param("inscriptionId") Long inscriptionId);

    void deleteByAssociationIdAndInscriptionId(Long associationId, Long inscriptionId);
}
