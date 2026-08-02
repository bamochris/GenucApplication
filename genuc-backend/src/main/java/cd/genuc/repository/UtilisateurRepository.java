// cd.genuc.repository.UtilisateurRepository.java
package cd.genuc.repository;

import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmail(String email);

    Optional<Utilisateur> findByTokenActivation(String token);

    Optional<Utilisateur> findByInscriptionId(Long inscriptionId);

    boolean existsByEmail(String email);

    List<Utilisateur> findByRole(RoleEnum role);

    List<Utilisateur> findByUniversiteId(Long universiteId);

    List<Utilisateur> findByActifTrue();

    List<Utilisateur> findByActifFalse();

    @Query("SELECT u FROM Utilisateur u WHERE u.nom LIKE %:nom% OR u.prenom LIKE %:nom%")
    List<Utilisateur> rechercherParNom(@Param("nom") String nom);

    @Query("SELECT COUNT(u) FROM Utilisateur u WHERE u.universiteId = :universiteId AND u.actif = true")
    long countActifsByUniversite(@Param("universiteId") Long universiteId);

    @Query("SELECT u FROM Utilisateur u WHERE u.role = :role AND u.universiteId = :universiteId")
    List<Utilisateur> findByRoleAndUniversiteId(@Param("role") RoleEnum role, @Param("universiteId") Long universiteId);

    List<Utilisateur> findByUniversiteIdAndRole(Long universiteId, RoleEnum role);

    long countByRole(RoleEnum role);

    // ─── Contrôle d'accès aux photos (FichierAccesService) ───
    @Query("SELECT u FROM Utilisateur u WHERE u.photoProfil = :url OR u.photoPasseport = :url")
    List<Utilisateur> findByPhoto(@Param("url") String url);
}
