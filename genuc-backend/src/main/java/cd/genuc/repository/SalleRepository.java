package cd.genuc.repository;

import cd.genuc.model.Salle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SalleRepository extends JpaRepository<Salle, Long> {
    List<Salle> findByUniversiteId(Long universiteId);
    List<Salle> findByUniversiteIdAndEstDisponibleTrue(Long universiteId);
    @Query("SELECT s FROM Salle s WHERE s.capacite >= :capacite AND s.universite.id = :uniId")
    List<Salle> findDisponiblesAvecCapacite(Long uniId, int capacite);
}