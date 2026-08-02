package cd.genuc.repository;

import cd.genuc.model.Ouvrage;
import cd.genuc.model.Ouvrage.TypeOuvrage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OuvrageRepository extends JpaRepository<Ouvrage, Long> {

    List<Ouvrage> findByUniversiteId(Long universiteId);

    List<Ouvrage> findByUniversiteIdAndActifTrue(Long universiteId);

    List<Ouvrage> findByTypeOuvrage(TypeOuvrage type);

    List<Ouvrage> findByCategorie(String categorie);

    @Query("SELECT o FROM Ouvrage o WHERE o.titre LIKE %:motCle% OR o.auteur LIKE %:motCle% OR o.isbn LIKE %:motCle%")
    List<Ouvrage> rechercherParMotCle(String motCle);

    @Query("SELECT o FROM Ouvrage o WHERE o.universite.id = :uniId AND o.typeOuvrage = :type")
    List<Ouvrage> findByUniversiteIdAndTypeOuvrage(Long uniId, TypeOuvrage type);

    @Query("SELECT COUNT(o) FROM Ouvrage o WHERE o.universite.id = :uniId AND o.quantiteDisponible > 0")
    long countDisponiblesByUniversite(Long uniId);
}