package cd.genuc.repository;

import cd.genuc.model.Deliberation;
import cd.genuc.model.Deliberation.StatutDeliberation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliberationRepository extends JpaRepository<Deliberation, Long> {

    // ─── Recherches de base ──────────────────────────────────

    Optional<Deliberation> findByInscriptionIdAndAnneeAcademique(Long inscriptionId, String anneeAcademique);

    List<Deliberation> findByInscriptionId(Long inscriptionId);

    List<Deliberation> findByDepartementIdAndAnneeAcademique(Long departementId, String anneeAcademique);

    List<Deliberation> findByUniversiteIdAndAnneeAcademique(Long universiteId, String anneeAcademique);

    Optional<Deliberation> findByUuidVerification(String uuid);

    Optional<Deliberation> findByCodeDiplome(String codeDiplome);

    List<Deliberation> findByAnneeAcademique(String anneeAcademique);

    boolean existsByInscriptionIdAndAnneeAcademique(Long inscriptionId, String anneeAcademique);

    boolean existsByInscriptionIdAndAnneeAcademiqueAndStatut(Long inscriptionId, String anneeAcademique, StatutDeliberation statut);

    // ─── Pagination ──────────────────────────────────────────

    Page<Deliberation> findByUniversiteIdAndAnneeAcademique(Long universiteId, String anneeAcademique, Pageable pageable);

    // ─── Statistiques (comptages) ──────────────────────────

    @Query("SELECT COUNT(d) FROM Deliberation d WHERE d.universite.id = :universiteId AND d.anneeAcademique = :annee AND d.decision = 'DIPLOME'")
    long countDiplomes(@Param("universiteId") Long universiteId, @Param("annee") String annee);

    @Query("SELECT COUNT(d) FROM Deliberation d WHERE d.universite.id = :universiteId AND d.anneeAcademique = :annee AND (d.decision = 'ADMIS' OR d.decision = 'DIPLOME')")
    long countAdmis(@Param("universiteId") Long universiteId, @Param("annee") String annee);

    @Query("SELECT COUNT(d) FROM Deliberation d WHERE d.universite.id = :universiteId AND d.anneeAcademique = :annee AND d.decision = 'ADMIS_RATTRAPAGE'")
    long countRattrapage(@Param("universiteId") Long universiteId, @Param("annee") String annee);

    @Query("SELECT COUNT(d) FROM Deliberation d WHERE d.universite.id = :universiteId AND d.anneeAcademique = :annee AND d.decision = 'REDOUBLE'")
    long countRedouble(@Param("universiteId") Long universiteId, @Param("annee") String annee);

    @Query("SELECT COUNT(d) FROM Deliberation d WHERE d.universite.id = :universiteId AND d.anneeAcademique = :annee AND d.decision = 'EXCLU'")
    long countExclu(@Param("universiteId") Long universiteId, @Param("annee") String annee);

    // ─── Stats par statut de délibération ──────────────────

    @Query("SELECT COUNT(d) FROM Deliberation d WHERE d.universite.id = :universiteId AND d.anneeAcademique = :annee AND d.statut = :statut")
    long countByStatut(@Param("universiteId") Long universiteId,
                       @Param("annee") String annee,
                       @Param("statut") StatutDeliberation statut);

    // ─── Liste des délibérations publiées ──────────────────

    @Query("SELECT d FROM Deliberation d WHERE d.universite.id = :universiteId AND d.anneeAcademique = :annee AND d.statut = 'PUBLIEE'")
    List<Deliberation> findPublieesByUniversiteAndAnnee(@Param("universiteId") Long universiteId,
                                                        @Param("annee") String annee);

    // ─── Jointure optimisée pour charger les inscriptions ──

    @Query("SELECT d FROM Deliberation d " +
           "JOIN FETCH d.inscription i " +
           "WHERE d.anneeAcademique = :annee " +
           "AND d.universite.id = :universiteId")
    List<Deliberation> findAllByAnneeWithDetails(@Param("annee") String annee,
                                                 @Param("universiteId") Long universiteId);

    // ─── Par département (pour le Chef de département) ─────

    @Query("SELECT d FROM Deliberation d WHERE d.departement.id = :departementId")
    List<Deliberation> findByDepartementId(@Param("departementId") Long departementId);

    @Query("SELECT d FROM Deliberation d WHERE d.departement.id = :departementId AND d.anneeAcademique = :annee")
    List<Deliberation> findByDepartementIdAndAnnee(@Param("departementId") Long departementId,
                                                   @Param("annee") String annee);

    // ─── Par promotion (si Inscription a une relation Promotion) ──
    // Si votre modèle Inscription a un champ `promotion`, décommentez et adaptez :
    /*
    @Query("SELECT d FROM Deliberation d WHERE d.inscription.promotion.id = :promotionId")
    List<Deliberation> findByPromotionId(@Param("promotionId") Long promotionId);

    @Query("SELECT d FROM Deliberation d WHERE d.inscription.promotion.id = :promotionId AND d.anneeAcademique = :annee")
    List<Deliberation> findByPromotionIdAndAnneeAcademique(@Param("promotionId") Long promotionId,
                                                           @Param("annee") String annee);
    */

    // ─── Pour le tableau de bord du jury ────────────────────

    @Query("SELECT d FROM Deliberation d WHERE d.universite.id = :universiteId AND d.anneeAcademique = :annee AND d.statut IN ('PRETE', 'TENUE')")
    List<Deliberation> findPretesOuTenues(@Param("universiteId") Long universiteId,
                                          @Param("annee") String annee);

    @Query("SELECT d FROM Deliberation d WHERE d.universite.id = :universiteId AND d.anneeAcademique = :annee AND d.statut = 'TENUE'")
    List<Deliberation> findTenues(@Param("universiteId") Long universiteId,
                                  @Param("annee") String annee);
}