package cd.genuc.repository;

import cd.genuc.model.ParametrePalmares;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParametrePalmaresRepository extends JpaRepository<ParametrePalmares, Long> {

    /**
     * Recherche les paramètres par université et année académique.
     * Utilisation de la convention de nommage : Universite_Id.
     */
    Optional<ParametrePalmares> findByUniversite_IdAndAnneeAcademique(Long universiteId, String anneeAcademique);

    /**
     * Récupère tous les paramètres pour lesquels la génération automatique est activée
     * et dont la date de génération est antérieure à la date donnée.
     * Utilisé par le scheduler pour déclencher les générations automatiques.
     */
    List<ParametrePalmares> findByAutoGenerationTrueAndDateGenerationBefore(LocalDate date);

    /**
     * Récupère tous les paramètres pour lesquels la génération automatique est activée.
     */
    List<ParametrePalmares> findByAutoGenerationTrue();

    /**
     * Récupère tous les paramètres d'une université donnée (optionnel).
     */
    List<ParametrePalmares> findByUniversite_Id(Long universiteId);
}