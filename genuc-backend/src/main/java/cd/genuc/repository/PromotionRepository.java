package cd.genuc.repository;

import cd.genuc.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    List<Promotion> findByFiliereId(Long filiereId);

    List<Promotion> findByFiliereIdAndAnneeAcademiqueId(Long filiereId, Long anneeAcademiqueId);

    Promotion findByFiliereIdAndLibelle(Long filiereId, String libelle);

    /**
     * Promotion d'un niveau donné POUR une année académique précise.
     *
     * <p>Une promotion est rattachée à une année ({@code annee_academique_id} est
     * NOT NULL) : « G2 » existe donc une fois par année ouverte.</p>
     */
    Optional<Promotion> findByFiliereIdAndLibelleAndAnneeAcademiqueId(
            Long filiereId, String libelle, Long anneeAcademiqueId);

    /**
     * Repli déterministe : la promotion la plus récente portant ce libellé.
     *
     * <p>{@link #findByFiliereIdAndLibelle} rend un résultat UNIQUE alors que
     * rien ne garantit l'unicité du couple (filière, libellé) — il y a autant de
     * lignes que d'années ouvertes. Dès la deuxième année d'exploitation, cet
     * appel lève {@code IncorrectResultSizeDataAccessException}. Comme le passage
     * de classe attrape les exceptions étudiant par étudiant, la panne se serait
     * traduite non par une erreur visible mais par une promotion générale
     * silencieusement bloquée.</p>
     */
    Optional<Promotion> findFirstByFiliereIdAndLibelleOrderByAnneeAcademiqueIdDesc(
            Long filiereId, String libelle);

    // ✅ Méthode corrigée : le chemin correct est p.filiere.departement.faculte.universite.id
    @Query("SELECT p FROM Promotion p WHERE p.filiere.departement.faculte.universite.id = :universiteId")
    List<Promotion> findByFiliereDepartementUniversiteId(@Param("universiteId") Long universiteId);
}