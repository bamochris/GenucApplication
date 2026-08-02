package cd.genuc.repository;

import cd.genuc.model.Inscription;
import cd.genuc.model.StatutInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {

    // ─── Contrôle d'accès (SecurityService) ──────────────────────
    /**
     * Projection minimale utilisée par {@code SecurityService.peutAccederInscription} :
     * de quoi décider si l'appelant est propriétaire de l'inscription (email) ou
     * rattaché au même établissement (universiteId), sans charger l'entité ni
     * déclencher de chargement paresseux.
     */
    interface ProprietaireInscription {
        Long getUniversiteId();
        String getEmailInscription();
        String getEmailEtudiant();
        String getMatricule();
    }

    @Query("""
           SELECT i.universite.id AS universiteId,
                  i.email         AS emailInscription,
                  e.email         AS emailEtudiant,
                  i.matricule     AS matricule
           FROM Inscription i LEFT JOIN i.etudiant e
           WHERE i.id = :id
           """)
    Optional<ProprietaireInscription> findProprietaire(@Param("id") Long id);

    // ─── Recherche par matricule ──────────────────────────────────
    @Query("SELECT i FROM Inscription i WHERE i.matricule = :matricule")
    Optional<Inscription> findByMatricule(@Param("matricule") String matricule);

    // ─── Recherche par matricule ET université ───────────────────
    // ⬇️ NOUVELLE MÉTHODE AJOUTÉE
    @Query("SELECT i FROM Inscription i WHERE i.matricule = :matricule AND i.universite.id = :universiteId")
    Optional<Inscription> findByMatriculeAndUniversiteId(@Param("matricule") String matricule,
                                                         @Param("universiteId") Long universiteId);

       Optional<Inscription> findByDossierInscriptionId(Long dossierInscriptionId);

       @Query("SELECT i FROM Inscription i WHERE LOWER(i.email) = LOWER(:email) AND i.universite.id = :universiteId ORDER BY i.creeLe DESC")
       List<Inscription> findByEmailAndUniversiteIdOrderByCreeLeDesc(@Param("email") String email,
                                                                                                                  @Param("universiteId") Long universiteId);

    // ─── Statistiques mensuelles (native) ────────────────────────
    @Query(value = "SELECT EXTRACT(MONTH FROM cree_le) as mois, COUNT(*) as total " +
                   "FROM inscriptions " +
                   "WHERE EXTRACT(YEAR FROM cree_le) = :annee " +
                   "GROUP BY mois ORDER BY mois", nativeQuery = true)
    List<Map<String, Object>> countByMois(@Param("annee") int annee);

    // ─── Par étudiant ─────────────────────────────────────────────
    List<Inscription> findByEtudiant_Id(Long etudiantId);

    // ─── Par université ───────────────────────────────────────────
    List<Inscription> findByUniversite_Id(Long universiteId);

    // ─── Par département ──────────────────────────────────────────
    List<Inscription> findByDepartement_Id(Long departementId);

    // ─── Par statut (enum) ───────────────────────────────────────
    List<Inscription> findByStatut(StatutInscription statut);

    // ─── Par université et statut ────────────────────────────────
    List<Inscription> findByUniversiteIdAndStatut(Long universiteId, StatutInscription statut);
    
    // ─── Par université et statut (alias) ────────────────────────
    List<Inscription> findByUniversite_IdAndStatut(Long universiteId, StatutInscription statut);

    // ─── Par département, niveau et statut ───────────────────────
    List<Inscription> findByDepartement_IdAndNiveauAndStatut(Long departementId, String niveau, StatutInscription statut);

    // ─── Comptage par université et année académique ────────────
    long countByUniversite_IdAndAnneeAcademique_Id(Long universiteId, Long anneeAcademiqueId);

    // ─── Existence d'une inscription validée pour un étudiant ───
    boolean existsByEtudiantIdAndStatut(Long etudiantId, StatutInscription statut);

    // ─── Comptage par département et statut ──────────────────────
    long countByDepartementIdAndStatut(Long departementId, StatutInscription statut);

    // ─── Recherche par étudiant et statut ────────────────────────
    @Query("SELECT i FROM Inscription i WHERE i.etudiant.id = :etudiantId AND i.statut = :statut")
    Optional<Inscription> findByEtudiantIdAndStatut(@Param("etudiantId") Long etudiantId, @Param("statut") StatutInscription statut);

    // ─── Recherche par statut, niveau et année ───────────────────
    @Query("SELECT i FROM Inscription i WHERE i.statut = :statut AND i.niveau = :niveau AND i.anneeAcademique.libelle = :annee")
    List<Inscription> findByStatutAndNiveauAndAnneeAcademique(@Param("statut") StatutInscription statut,
                                                               @Param("niveau") String niveau,
                                                               @Param("annee") String annee);

    // ─── Par année académique ────────────────────────────────────
    List<Inscription> findByAnneeAcademiqueId(Long anneeAcademiqueId);

    // ─── Par promotion ────────────────────────────────────────────
    List<Inscription> findByPromotionId(Long promotionId);

    // ─── Par université et année académique ──────────────────────
    List<Inscription> findByUniversiteIdAndAnneeAcademiqueId(Long universiteId, Long anneeAcademiqueId);

    // ─── Par université (simple) ─────────────────────────────────
    List<Inscription> findByUniversiteId(Long universiteId);

    // ─── Comptage par université et statut ───────────────────────
    long countByUniversite_IdAndStatut(Long universiteId, StatutInscription statut);

    // ─── Comptage global par statut ──────────────────────────────
    long countByStatut(StatutInscription statut);

    // Comptage global, limité aux universités actives (statistiques super admin)
    long countByStatutAndUniversiteActifTrue(StatutInscription statut);
    long countByUniversiteActifTrue();

    // ══════════════════════════════════════════════════════════════
    // MÉTHODES POUR LE MODULE DÉLIBÉRATION
    // ══════════════════════════════════════════════════════════════

    @Query("SELECT i FROM Inscription i " +
           "JOIN Note n ON n.inscription.id = i.id " +
           "WHERE i.matricule = :matricule " +
           "AND n.cours.id = :coursId " +
           "AND i.anneeAcademique.libelle = :annee")
    Optional<Inscription> findByMatriculeAndCoursAndAnnee(@Param("matricule") String matricule,
                                                          @Param("coursId") Long coursId,
                                                          @Param("annee") String annee);

    @Query("SELECT i FROM Inscription i " +
           "WHERE i.universite.id = :universiteId " +
           "AND i.anneeAcademique.libelle = :annee " +
           "AND i.statut IN ('VALIDE')")
    List<Inscription> findByUniversiteIdAndAnnee(@Param("universiteId") Long universiteId,
                                                 @Param("annee") String annee);

    @Query("SELECT i FROM Inscription i " +
           "WHERE i.departement.id = :departementId " +
           "AND i.anneeAcademique.libelle = :annee " +
           "AND i.statut IN ('VALIDE')")
    List<Inscription> findByDepartementIdAndAnnee(@Param("departementId") Long departementId,
                                                  @Param("annee") String annee);

    @Query("SELECT i FROM Inscription i " +
           "JOIN FETCH i.etudiant e " +
           "JOIN FETCH i.departement d " +
           "JOIN FETCH i.universite u " +
           "WHERE i.id = :id")
    Optional<Inscription> findByIdWithDetails(@Param("id") Long id);

    long countByUniversiteIdAndAnneeAcademiqueLibelle(Long universiteId, String annee);

    @Query("SELECT COUNT(n) > 0 FROM Note n " +
           "WHERE n.inscription.etudiant.id = :etudiantId " +
           "AND n.cours.id = :coursId " +
           "AND n.inscription.anneeAcademique.libelle = :annee")
    boolean existsByEtudiantAndCoursAndAnnee(@Param("etudiantId") Long etudiantId,
                                             @Param("coursId") Long coursId,
                                             @Param("annee") String annee);
    
    @Query("SELECT i FROM Inscription i WHERE i.matricule IN :matricules")
    List<Inscription> findByMatriculeIn(@Param("matricules") List<String> matricules);

    // ─── Recherche floue (matricule / nom / prénom) pour caisse et affectation de frais ───
    @Query("SELECT i FROM Inscription i WHERE " +
           "LOWER(i.matricule) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(i.nom) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(i.prenom) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Inscription> rechercher(@Param("q") String q, org.springframework.data.domain.Pageable pageable);
}
