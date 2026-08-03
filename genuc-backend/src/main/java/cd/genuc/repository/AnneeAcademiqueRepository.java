package cd.genuc.repository;

import cd.genuc.model.AnneeAcademique;
import cd.genuc.model.Universite;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnneeAcademiqueRepository extends JpaRepository<AnneeAcademique, Long> {

    // Pas de findByLibelle(String) : « 2025-2026 » n'identifie pas une ligne.
    // L'unicité porte sur (libelle, universite_id) — il existe une année par
    // établissement. Une recherche sur le seul libellé, typée pour un résultat
    // unique, échouait dès le deuxième établissement raccordé, et pouvait
    // auparavant rendre l'année d'autrui. Passer TOUJOURS par la méthode
    // ci-dessous ; la retirer d'ici est ce qui empêche l'erreur de revenir.

    List<AnneeAcademique> findByActiveTrue();
    Optional<AnneeAcademique> findByLibelleAndUniversite(String libelle, Universite universite);
    List<AnneeAcademique> findByUniversiteId(Long universiteId);
}