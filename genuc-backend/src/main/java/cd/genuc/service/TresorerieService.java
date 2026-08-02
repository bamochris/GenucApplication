package cd.genuc.service;

import cd.genuc.model.Depense;
import cd.genuc.repository.DepenseRepository;
import cd.genuc.repository.PaieRepository;
import cd.genuc.repository.PaiementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TresorerieService {

    private final DepenseRepository depenseRepo;
    private final PaiementRepository paiementRepo;   // paiements des étudiants
    private final PaieRepository paieRepo;          // paie des employés

    /**
     * Enregistre une nouvelle dépense (hors paie)
     */
    @Transactional
    public Depense enregistrerDepense(Depense depense) {
        if (depense.getMontant() <= 0) {
            throw new RuntimeException("Le montant de la dépense doit être supérieur à zéro");
        }
        log.info("Enregistrement d'une dépense : {} - {} USD", depense.getLibelle(), depense.getMontant());
        return depenseRepo.save(depense);
    }

    /**
     * Situation financière journalière (recettes - dépenses)
     * - Recettes : paiements étudiants validés
     * - Dépenses : toutes les dépenses enregistrées (hors paie)
     */
    public Map<String, Object> getSituationJournaliere(Long universiteId) {
        LocalDate today = LocalDate.now();

        Double recettes = paiementRepo.totalCollecteParPeriode(universiteId, today, today);
        if (recettes == null) recettes = 0.0;

        Double depenses = depenseRepo.sumByUniversiteIdAndDate(universiteId, today);
        if (depenses == null) depenses = 0.0;

        Map<String, Object> situation = new LinkedHashMap<>();
        situation.put("date", today.toString());
        situation.put("recettes", recettes);
        situation.put("depenses", depenses);
        situation.put("solde", recettes - depenses);

        return situation;
    }

    /**
     * Masse salariale du mois (pour le suivi RH)
     */
    public Double getMasseSalarialeMois(Long universiteId, String mois, Integer annee) {
        Double total = paieRepo.sumNetAPayerByUniversiteIdAndMois(universiteId, mois, annee);
        return total != null ? total : 0.0;
    }

    /**
     * Récupère toutes les dépenses du jour pour une université
     */
    public List<Depense> getDepensesDuJour(Long universiteId) {
        return depenseRepo.findByUniversiteIdAndDateDepenseBetween(universiteId, LocalDate.now(), LocalDate.now());
    }

    /**
     * Récupère les dépenses d'une période donnée
     */
    public List<Depense> getDepensesParPeriode(Long universiteId, LocalDate debut, LocalDate fin) {
        return depenseRepo.findByUniversiteIdAndDateDepenseBetween(universiteId, debut, fin);
    }

    /**
     * Récupère le total des dépenses sur une période
     */
    public Double getTotalDepensesParPeriode(Long universiteId, LocalDate debut, LocalDate fin) {
        Double total = depenseRepo.sumByUniversiteIdAndDateBetween(universiteId, debut, fin);
        return total != null ? total : 0.0;
    }

    /**
     * Récupère les dépenses par catégorie avec les montants totaux
     */
    public Map<Depense.CategorieDepense, Double> getDepensesParCategorie(Long universiteId) {
        List<Object[]> results = depenseRepo.sumByCategorieGroupByUniversite(universiteId);
        Map<Depense.CategorieDepense, Double> map = new LinkedHashMap<>();
        for (Object[] row : results) {
            Depense.CategorieDepense categorie = (Depense.CategorieDepense) row[0];
            Double montant = (Double) row[1];
            map.put(categorie, montant != null ? montant : 0.0);
        }
        return map;
    }
}