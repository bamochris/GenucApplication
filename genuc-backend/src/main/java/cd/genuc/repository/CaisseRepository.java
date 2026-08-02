package cd.genuc.repository;

import cd.genuc.model.Caisse;
import cd.genuc.model.Caisse.StatutCaisse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CaisseRepository extends JpaRepository<Caisse, Long> {

    Optional<Caisse> findByUniversiteIdAndStatut(Long universiteId, StatutCaisse statut);

    List<Caisse> findByUniversiteIdOrderByDateOuvertureDesc(Long universiteId);

    List<Caisse> findByStatut(StatutCaisse statut);

    List<Caisse> findByDateOuvertureBetween(LocalDate debut, LocalDate fin);
}