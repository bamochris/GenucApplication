package cd.genuc.repository;

import cd.genuc.model.Conge;
import cd.genuc.model.Conge.StatutConge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CongeRepository extends JpaRepository<Conge, Long> {

    List<Conge> findByPersonnelId(Long personnelId);

    List<Conge> findByPersonnelIdAndStatut(Long personnelId, StatutConge statut);

    List<Conge> findByStatut(StatutConge statut);

    List<Conge> findByValideParId(Long valideParId);

    List<Conge> findByDateDebutBetween(LocalDate debut, LocalDate fin);

    List<Conge> findByPersonnelIdAndDateDebutBetween(Long personnelId, LocalDate debut, LocalDate fin);

    boolean existsByPersonnelIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(
            Long personnelId, LocalDate dateFin, LocalDate dateDebut);
}