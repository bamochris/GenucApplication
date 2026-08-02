package cd.genuc.repository;

import cd.genuc.model.Budget;
import cd.genuc.model.Budget.CategorieBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUniversiteIdAndAnnee(Long universiteId, Integer annee);

    List<Budget> findByUniversiteIdAndCategorie(Long universiteId, CategorieBudget categorie);
}