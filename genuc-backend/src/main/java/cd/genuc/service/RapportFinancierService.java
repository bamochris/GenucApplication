// src/main/java/cd/genuc/service/RapportFinancierService.java
package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.StatutAffectation;
import cd.genuc.model.Paiement.StatutPaiement;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RapportFinancierService {

    private final AffectationFraisRepository affectationRepo;
    private final PaiementRepository paiementRepo;
    private final InscriptionRepository inscriptionRepo;
    private final PromotionRepository promotionRepo;
    private final DepartementRepository departementRepo;

    // ─── DETTES ÉTUDIANTES ──────────────────────────────────────

    public List<Map<String, Object>> getDettesEtudiantes(Long universiteId) {
        List<AffectationFrais> dettes = affectationRepo.findDettesActivesByUniversite(universiteId);

        // Grouper par inscription
        Map<Long, List<AffectationFrais>> parEtudiant = dettes.stream()
                .collect(Collectors.groupingBy(af -> af.getInscription().getId()));

        List<Map<String, Object>> resultats = new ArrayList<>();
        for (Map.Entry<Long, List<AffectationFrais>> entry : parEtudiant.entrySet()) {
            Inscription ins = entry.getValue().get(0).getInscription();
            double totalDette = entry.getValue().stream().mapToDouble(AffectationFrais::getReste).sum();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("inscriptionId", ins.getId());
            row.put("matricule", ins.getMatricule());
            row.put("etudiant", ins.getPrenom() + " " + ins.getNom());
            row.put("promotion", ins.getPromotion() != null ? ins.getPromotion().getLibelle() : "-");
            row.put("totalDette", totalDette);
            row.put("nbDettes", entry.getValue().size());
            resultats.add(row);
        }

        return resultats.stream()
                .sorted((a, b) -> Double.compare((Double) b.get("totalDette"), (Double) a.get("totalDette")))
                .collect(Collectors.toList());
    }

    // ─── TAUX DE RECOUVREMENT ──────────────────────────────────

    public Map<String, Object> getTauxRecouvrement(Long universiteId, String annee) {
        List<AffectationFrais> affectations = affectationRepo.findDettesActivesByUniversite(universiteId);

        double totalAttendu = affectations.stream()
                .mapToDouble(AffectationFrais::getMontant)
                .sum();

        double totalPaye = affectations.stream()
                .filter(af -> af.getStatut() == StatutAffectation.PAYE)
                .mapToDouble(AffectationFrais::getMontant)
                .sum();

        double totalReste = affectations.stream()
                .mapToDouble(AffectationFrais::getReste)
                .sum();

        double taux = totalAttendu > 0 ? (totalPaye / totalAttendu) * 100 : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("universiteId", universiteId);
        result.put("annee", annee);
        result.put("totalAttendu", totalAttendu);
        result.put("totalPaye", totalPaye);
        result.put("totalReste", totalReste);
        result.put("tauxRecouvrement", Math.round(taux));
        result.put("nbEtudiantsDette", affectations.stream()
                .map(af -> af.getInscription().getId())
                .distinct()
                .count());

        return result;
    }

    // ─── PAIEMENTS PAR FACULTÉ ──────────────────────────────────

    public List<Map<String, Object>> getPaiementsParFaculte(Long universiteId, String annee) {
        List<Paiement> paiements = paiementRepo.findByUniversiteId(universiteId).stream()
                .filter(p -> p.getStatut() == StatutPaiement.VALIDE)
                .filter(p -> annee == null || p.getDatePaiement().getYear() == Integer.parseInt(annee.split("-")[0]))
                .collect(Collectors.toList());

        // Récupérer les départements (facultés) de l'université
        List<Departement> departements = departementRepo.findByUniversiteId(universiteId);

        Map<String, Double> parFaculte = new LinkedHashMap<>();
        for (Departement dept : departements) {
            double total = paiements.stream()
                    .filter(p -> p.getInscription().getDepartement().getId().equals(dept.getId()))
                    .mapToDouble(Paiement::getMontant)
                    .sum();
            if (total > 0) {
                parFaculte.put(dept.getNom(), total);
            }
        }

        return parFaculte.entrySet().stream()
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("faculte", e.getKey());
                    row.put("total", e.getValue());
                    return row;
                })
                .collect(Collectors.toList());
    }

    // ─── PAIEMENTS PAR PROMOTION ────────────────────────────────

    public List<Map<String, Object>> getPaiementsParPromotion(Long universiteId, String annee) {
        List<Paiement> paiements = paiementRepo.findByUniversiteId(universiteId).stream()
                .filter(p -> p.getStatut() == StatutPaiement.VALIDE)
                .filter(p -> annee == null || p.getDatePaiement().getYear() == Integer.parseInt(annee.split("-")[0]))
                .collect(Collectors.toList());

        // Récupérer les promotions de l'université
        List<Promotion> promotions = promotionRepo.findByFiliereDepartementUniversiteId(universiteId);

        Map<String, Double> parPromotion = new LinkedHashMap<>();
        for (Promotion promo : promotions) {
            double total = paiements.stream()
                    .filter(p -> p.getInscription().getPromotion().getId().equals(promo.getId()))
                    .mapToDouble(Paiement::getMontant)
                    .sum();
            if (total > 0) {
                parPromotion.put(promo.getLibelle(), total);
            }
        }

        return parPromotion.entrySet().stream()
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("promotion", e.getKey());
                    row.put("total", e.getValue());
                    return row;
                })
                .collect(Collectors.toList());
    }

    // ─── ÉVOLUTION DES RECETTES ──────────────────────────────────

    public Map<String, Object> getEvolutionRecettes(Long universiteId, int annee) {
        Map<String, Double> evolution = new LinkedHashMap<>();

        for (int mois = 1; mois <= 12; mois++) {
            LocalDate debut = LocalDate.of(annee, mois, 1);
            LocalDate fin = debut.withDayOfMonth(debut.lengthOfMonth());
            double total = paiementRepo.totalCollecteParPeriode(universiteId, debut, fin);
            String moisNom = debut.getMonth().name().substring(0, 3);
            evolution.put(moisNom + " " + annee, total);
        }

        double totalAnnee = evolution.values().stream().mapToDouble(Double::doubleValue).sum();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("annee", annee);
        result.put("totalAnnee", totalAnnee);
        result.put("evolution", evolution);
        return result;
    }

    // ─── PRÉVISIONS FINANCIÈRES ──────────────────────────────────

    public Map<String, Object> getPrevisionsFinancieres(Long universiteId, String annee) {
        List<AffectationFrais> affectations = affectationRepo.findDettesActivesByUniversite(universiteId);

        double totalDette = affectations.stream().mapToDouble(AffectationFrais::getReste).sum();
        double totalAttendu = affectations.stream().mapToDouble(AffectationFrais::getMontant).sum();

        // Taux de recouvrement estimé basé sur les années précédentes
        double tauxRecouvrementHistorique = 0.75; // À calculer à partir des données réelles
        double recettePrevue = totalAttendu * tauxRecouvrementHistorique;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("annee", annee);
        result.put("totalDette", totalDette);
        result.put("totalAttendu", totalAttendu);
        result.put("tauxRecouvrementHistorique", tauxRecouvrementHistorique * 100);
        result.put("recettePrevue", Math.round(recettePrevue));
        result.put("objectifRecouvrement", totalAttendu);
        result.put("ecart", totalAttendu - recettePrevue);

        return result;
    }
}