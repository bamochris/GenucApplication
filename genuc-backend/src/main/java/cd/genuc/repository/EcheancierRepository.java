package cd.genuc.repository;

import cd.genuc.model.Echeancier;
import cd.genuc.model.Echeancier.StatutEcheancier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EcheancierRepository extends JpaRepository<Echeancier, Long> {

    List<Echeancier> findByInscriptionId(Long inscriptionId);

    List<Echeancier> findByInscriptionIdAndStatut(Long inscriptionId, StatutEcheancier statut);

    List<Echeancier> findByUniversiteId(Long universiteId);

    @Query("SELECT e FROM Echeancier e WHERE e.inscription.etudiant.id = :etudiantId")
    List<Echeancier> findByEtudiantId(Long etudiantId);

    @Query("SELECT e FROM Echeancier e WHERE e.universite.id = :uniId AND e.statut = 'ACTIF'")
    List<Echeancier> findActifsParUniversite(Long uniId);
}