package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ComptabiliteService {

    private final CompteComptableRepository compteRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final BudgetRepository budgetRepo;

    // ─── COMPTES ─────────────────────────────────────────────────────

    public List<CompteComptable> getComptes(Long universiteId) {
        return compteRepo.findByUniversiteIdAndActifTrue(universiteId);
    }

    @Transactional
    public CompteComptable creerCompte(CompteComptable compte) {
        return compteRepo.save(compte);
    }

    @Transactional
    public CompteComptable modifierCompte(Long id, CompteComptable details) {
        CompteComptable compte = compteRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte introuvable"));
        compte.setLibelle(details.getLibelle());
        compte.setType(details.getType());
        compte.setActif(details.isActif());
        return compteRepo.save(compte);
    }

    // ─── ÉCRITURES ──────────────────────────────────────────────────

    @Transactional
    public EcritureComptable enregistrerEcriture(EcritureComptable ecriture) {
        // Vérifier l'équilibre (débit = crédit) – ici on suppose que montant est le même
        // Dans un système réel, on aurait débit et crédit séparés
        if (ecriture.getMontant() <= 0) {
            throw new RuntimeException("Le montant doit être positif");
        }
        return ecritureRepo.save(ecriture);
    }

    @Transactional
    public EcritureComptable validerEcriture(Long id, Long valideurId) {
        EcritureComptable ecriture = ecritureRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Écriture introuvable"));
        ecriture.setValidee(true);
        ecriture.setValideParId(valideurId);
        return ecritureRepo.save(ecriture);
    }

    public List<EcritureComptable> getEcrituresParPeriode(Long universiteId, LocalDate debut, LocalDate fin) {
        return ecritureRepo.findByUniversiteIdAndDateEcritureBetween(universiteId, debut, fin);
    }

    // ─── BUDGET ─────────────────────────────────────────────────────

    public List<Budget> getBudgets(Long universiteId, Integer annee) {
        return budgetRepo.findByUniversiteIdAndAnnee(universiteId, annee);
    }

    @Transactional
    public Budget creerBudget(Budget budget) {
        return budgetRepo.save(budget);
    }

    @Transactional
    public Budget utiliserBudget(Long budgetId, Double montant) {
        Budget budget = budgetRepo.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget introuvable"));
        if (budget.getMontantUtilise() + montant > budget.getMontantTotal()) {
            throw new RuntimeException("Budget insuffisant");
        }
        budget.setMontantUtilise(budget.getMontantUtilise() + montant);
        return budgetRepo.save(budget);
    }

    // ─── RAPPORTS ──────────────────────────────────────────────────

    public Map<String, Object> getBalance(Long universiteId, LocalDate date) {
        List<CompteComptable> comptes = compteRepo.findByUniversiteIdAndActifTrue(universiteId);
        Map<String, Object> balance = new LinkedHashMap<>();

        double totalDebit = 0;
        double totalCredit = 0;

        for (CompteComptable c : comptes) {
            Double mouvements = ecritureRepo.sumMouvementsByCompte(c.getId());
            if (mouvements == null) mouvements = 0.0;
            balance.put(c.getCode() + " - " + c.getLibelle(), mouvements);
            // Calcul simplifié
            if (c.getType() == CompteComptable.TypeCompte.ACTIF ||
                c.getType() == CompteComptable.TypeCompte.CHARGE) {
                totalDebit += mouvements;
            } else {
                totalCredit += mouvements;
            }
        }

        balance.put("_totalDebit", totalDebit);
        balance.put("_totalCredit", totalCredit);
        balance.put("_solde", totalDebit - totalCredit);

        return balance;
    }
}