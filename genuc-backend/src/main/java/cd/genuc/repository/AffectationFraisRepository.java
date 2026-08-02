package cd.genuc.repository;

import cd.genuc.model.AffectationFrais;
import cd.genuc.model.StatutAffectation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AffectationFraisRepository extends JpaRepository<AffectationFrais, Long> {

    List<AffectationFrais> findByInscriptionId(Long inscriptionId);

    List<AffectationFrais> findByInscriptionIdAndStatut(Long inscriptionId, StatutAffectation statut);

    List<AffectationFrais> findByFraisId(Long fraisId);

    // ✅ Ajout de JOIN FETCH pour charger frais et inscription avec leurs relations
    @Query("SELECT a FROM AffectationFrais a " +
           "JOIN FETCH a.frais f " +
           "JOIN FETCH a.inscription i " +
           "WHERE a.inscription.universite.id = :uniId AND a.statut IN ('EN_ATTENTE', 'PARTIEL')")
    List<AffectationFrais> findDettesActivesByUniversite(@Param("uniId") Long universiteId);

    @Query("SELECT a FROM AffectationFrais a " +
           "JOIN FETCH a.frais " +
           "WHERE a.inscription.id = :inscriptionId AND a.statut IN ('EN_ATTENTE', 'PARTIEL')")
    List<AffectationFrais> findDettesActivesByInscription(@Param("inscriptionId") Long inscriptionId);

    @Query("SELECT SUM(a.reste) FROM AffectationFrais a WHERE a.inscription.id = :inscriptionId AND a.statut IN ('EN_ATTENTE', 'PARTIEL')")
    Double sumResteByInscription(@Param("inscriptionId") Long inscriptionId);

    @Query("SELECT a FROM AffectationFrais a WHERE a.paiement.id = :paiementId")
    List<AffectationFrais> findByPaiementId(@Param("paiementId") Long paiementId);

    @Query("SELECT a FROM AffectationFrais a WHERE a.dateEcheance < CURRENT_DATE AND a.statut IN ('EN_ATTENTE', 'PARTIEL')")
    List<AffectationFrais> findEcheancesDepassees();

       @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM AffectationFrais a " +
                 "WHERE a.inscription.id = :inscriptionId AND a.frais.code IN :codes AND a.statut = :statut")
       boolean existsByInscriptionIdAndFraisCodesAndStatut(@Param("inscriptionId") Long inscriptionId,
                                                                                                  @Param("codes") List<String> codes,
                                                                                                  @Param("statut") StatutAffectation statut);

    List<AffectationFrais> findByPromotionId(Long promotionId);
}
