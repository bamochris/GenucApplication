// cd.genuc.repository.LivreRepository.java
package cd.genuc.repository;

import cd.genuc.model.Livre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LivreRepository extends JpaRepository<Livre, Long> {

    List<Livre> findByUniversiteId(Long universiteId);
    
    List<Livre> findByCategorie(String categorie);
    
    List<Livre> findByAuteurContainingIgnoreCase(String auteur);
    
    @Query("SELECT l FROM Livre l WHERE l.titre LIKE %:motCle% OR l.auteur LIKE %:motCle% OR l.isbn LIKE %:motCle%")
    List<Livre> rechercherParMotCle(@Param("motCle") String motCle);
    
    @Query("SELECT l FROM Livre l WHERE l.universite.id = :universiteId AND l.actif = true")
    List<Livre> findActifsByUniversite(@Param("universiteId") Long universiteId);
    
    @Query("SELECT l FROM Livre l WHERE l.universite.id = :universiteId AND l.categorie = :categorie")
    List<Livre> findByCategorieAndUniversiteId(@Param("categorie") String categorie, @Param("universiteId") Long universiteId);
    
    @Query("SELECT COUNT(l) FROM Livre l WHERE l.universite.id = :universiteId")
    long countByUniversiteId(@Param("universiteId") Long universiteId);
    
    @Query("SELECT COUNT(l) FROM Livre l WHERE l.universite.id = :universiteId AND l.quantiteDisponible > 0")
    long countDisponiblesByUniversiteId(@Param("universiteId") Long universiteId);

	List<Livre> findByUniversiteIdAndActifTrue(Long universiteId);
}