package cd.genuc.repository;

import cd.genuc.model.Contrat;
import cd.genuc.model.Contrat.StatutContrat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContratRepository extends JpaRepository<Contrat, Long> {

    List<Contrat> findByPersonnelId(Long personnelId);

    Optional<Contrat> findByPersonnelIdAndStatut(Long personnelId, StatutContrat statut);

    @Query("SELECT c FROM Contrat c WHERE c.personnel.universite.id = :universiteId AND c.statut = :statut")
    List<Contrat> findByPersonnelUniversiteIdAndStatut(Long universiteId, StatutContrat statut);

    long countByPersonnelUniversiteIdAndStatut(Long universiteId, StatutContrat statut);
}