package cd.genuc.repository;

import cd.genuc.model.Emprunt;
import cd.genuc.model.Emprunt.StatutEmprunt;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmpruntRepository extends JpaRepository<Emprunt, Long> {

    List<Emprunt> findByEtudiantId(Long etudiantId);

    List<Emprunt> findByLivreId(Long livreId);

    List<Emprunt> findByStatutAndDateRetourPrevueBefore(Emprunt.StatutEmprunt statut, LocalDate date);

    @Query("SELECT COUNT(e) FROM Emprunt e WHERE e.etudiant.id = :etudiantId AND e.statut = 'EN_COURS'")
    long countEmpruntsActifsByEtudiant(@Param("etudiantId") Long etudiantId);

    // ⚠ Le type de retour était List<Livre> : Spring Data tentait de projeter
    // des Emprunt en Livre, ce qui faisait échouer la requête à l'exécution
    // (500 sur /api/bibliotheque/stats/{universiteId}).
    List<Emprunt> findByStatut(StatutEmprunt statut);

    // Emprunts en cours d'une université (vue admin / bibliothécaire)
    @Query("SELECT e FROM Emprunt e WHERE e.livre.universite.id = :universiteId AND e.statut = 'EN_COURS' ORDER BY e.dateEmprunt DESC")
    List<Emprunt> findActifsByUniversite(@Param("universiteId") Long universiteId);
}
