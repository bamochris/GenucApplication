package cd.genuc.repository;

import cd.genuc.model.Etudiant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EtudiantRepository extends JpaRepository<Etudiant, Long> {

    /**
     * Rechercher un étudiant par email
     */
    Optional<Etudiant> findByEmail(String email);

    /**
     * Rechercher un étudiant par matricule permanent
     */
    Optional<Etudiant> findByMatriculePermanent(String matriculePermanent);

    /**
     * Vérifier si un email existe déjà
     */
    boolean existsByEmail(String email);

    /**
     * Vérifier si un matricule permanent existe déjà
     */
    boolean existsByMatriculePermanent(String matriculePermanent);

    /**
     * Rechercher par nom
     */
    List<Etudiant> findByNomContainingIgnoreCase(String nom);

    /**
     * Rechercher par prénom
     */
    List<Etudiant> findByPrenomContainingIgnoreCase(String prenom);

    /**
     * Rechercher par nom ou prénom
     */
    List<Etudiant> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(
            String nom,
            String prenom
    );

    /**
     * Étudiants actifs
     */
    List<Etudiant> findByActifTrue();

    /**
     * Étudiants inactifs
     */
    List<Etudiant> findByActifFalse();

    /**
     * Nombre total d'étudiants actifs
     */
    long countByActifTrue();
}