package cd.genuc.repository;

import cd.genuc.model.BaremePaiement;
import cd.genuc.model.Paiement.TypePaiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BaremePaiementRepository extends JpaRepository<BaremePaiement, Long> {

    List<BaremePaiement> findByUniversiteIdAndAnneeAcademiqueAndActifTrue(
        Long universiteId, String anneeAcademique
    );

    @Query("SELECT b FROM BaremePaiement b WHERE b.universite.id = :uniId " +
           "AND b.anneeAcademique = :annee AND b.niveau = :niveau " +
           "AND b.typePaiement = :type " +
           "AND b.actif = true " +
           "ORDER BY b.departementId DESC")
    List<BaremePaiement> findBareme(
        @Param("uniId") Long uniId,
        @Param("annee") String annee,
        @Param("niveau") String niveau,
        @Param("type") TypePaiement type
    );

	List<BaremePaiement> findByUniversiteIdAndAnneeAcademique(Long universiteId, String anneeActuelle);

	List<BaremePaiement> findByAnneeAcademique(String anneeActuelle);
}