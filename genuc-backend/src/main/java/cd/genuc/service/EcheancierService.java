package cd.genuc.service;

import cd.genuc.exception.BusinessException;
import cd.genuc.exception.EcheancierNotFoundException;
import cd.genuc.exception.InscriptionNotFoundException;
import cd.genuc.model.*;
import cd.genuc.model.Echeance.StatutEcheance;
import cd.genuc.model.Echeancier.StatutEcheancier;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EcheancierService {

    private final EcheancierRepository echeancierRepo;
    private final EcheanceRepository echeanceRepo;
    private final InscriptionRepository inscriptionRepo;
    private final UniversiteRepository universiteRepo;
    private final PaiementRepository paiementRepo;

    private static final double PENALITE_PAR_JOUR = 0.50; // 0.50 USD par jour de retard

    /**
     * Crée un échéancier pour une inscription
     */
    @Transactional
    public Echeancier creerEcheancier(Long inscriptionId, String libelle, Double montantTotal,
                                      Integer nombreEcheances, String description) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new InscriptionNotFoundException(inscriptionId));

        if (montantTotal <= 0) {
            throw new BusinessException("Le montant total doit être supérieur à zéro");
        }
        if (nombreEcheances < 1 || nombreEcheances > 12) {
            throw new BusinessException("Le nombre d'échéances doit être entre 1 et 12");
        }

        double montantParEcheance = montantTotal / nombreEcheances;

        Echeancier echeancier = Echeancier.builder()
                .libelle(libelle)
                .montantTotal(montantTotal)
                .nombreEcheances(nombreEcheances)
                .description(description)
                .statut(StatutEcheancier.ACTIF)
                .inscription(inscription)
                .universite(inscription.getUniversite())
                .build();

        echeancier = echeancierRepo.save(echeancier);

        // Créer les échéances
        LocalDate dateDebut = LocalDate.now().plusDays(30); // première échéance dans 30 jours
        List<Echeance> echeances = new ArrayList<>();

        for (int i = 1; i <= nombreEcheances; i++) {
            double montant = (i == nombreEcheances) 
                ? montantTotal - (montantParEcheance * (nombreEcheances - 1)) // ajustement pour éviter les arrondis
                : montantParEcheance;

            LocalDate dateEcheance = dateDebut.plusMonths(i - 1);

            Echeance echeance = Echeance.builder()
                    .numeroEcheance(i)
                    .montant(Math.round(montant * 100.0) / 100.0)
                    .dateEcheance(dateEcheance)
                    .statut(StatutEcheance.EN_ATTENTE)
                    .echeancier(echeancier)
                    .build();

            echeances.add(echeance);
        }

        echeanceRepo.saveAll(echeances);
        echeancier.setEcheances(echeances);

        return echeancier;
    }

    /**
     * Génère automatiquement un échéancier pour une inscription nouvellement créée
     * Utilise les paramètres de l'université (frais par crédit)
     */
    @Transactional
    public Echeancier genererEcheancierAutomatique(Long inscriptionId, ParametresUniversite parametres) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new InscriptionNotFoundException(inscriptionId));

        // Calcul du montant total
        double montantTotal;
        if (parametres.getFraisParCredit() > 0) {
            // Calcul basé sur les crédits
            int creditsTotal = inscription.getFiliere().getCreditsTotal();
            montantTotal = creditsTotal * parametres.getFraisParCredit();
        } else {
            // Utiliser les frais de base de l'université
            montantTotal = inscription.getUniversite().getFraisBase();
        }

        // Ajouter les frais d'inscription
        montantTotal += parametres.getFraisInscription();

        String libelle = "Minerval " + inscription.getAnneeAcademique().getLibelle();
        String description = "Échéancier automatique pour l'année " + inscription.getAnneeAcademique().getLibelle();

        return creerEcheancier(inscriptionId, libelle, montantTotal, 3, description);
    }

    /**
     * Liste tous les échéanciers d'un étudiant
     */
    public List<Echeancier> getEcheanciersParEtudiant(Long etudiantId) {
        return echeancierRepo.findByEtudiantId(etudiantId);
    }

    /**
     * Liste tous les échéanciers d'une inscription
     */
    public List<Echeancier> getEcheanciersParInscription(Long inscriptionId) {
        return echeancierRepo.findByInscriptionId(inscriptionId);
    }

    /**
     * Récupère un échéancier avec ses échéances
     */
    public Echeancier getEcheancierComplet(Long echeancierId) {
        Echeancier echeancier = echeancierRepo.findById(echeancierId)
                .orElseThrow(() -> new EcheancierNotFoundException(echeancierId));
        // Forcer le chargement des échéances
        echeancier.getEcheances().size();
        return echeancier;
    }

    /**
     * Calcule les pénalités pour toutes les échéances en retard
     */
    @Transactional
    public void calculerPenalites() {
        List<Echeance> enRetard = echeanceRepo.findEcheancesEnRetard(LocalDate.now());
        for (Echeance echeance : enRetard) {
            echeance.calculerPenalite(PENALITE_PAR_JOUR);
            echeanceRepo.save(echeance);
        }
    }

    /**
     * Annule un échéancier
     */
    @Transactional
    public void annulerEcheancier(Long echeancierId) {
        Echeancier echeancier = echeancierRepo.findById(echeancierId)
                .orElseThrow(() -> new EcheancierNotFoundException(echeancierId));
        echeancier.setStatut(StatutEcheancier.ANNULE);
        echeancierRepo.save(echeancier);

        // Annuler les échéances non payées
        for (Echeance echeance : echeancier.getEcheances()) {
            if (echeance.getStatut() != StatutEcheance.PAYEE) {
                echeance.setStatut(StatutEcheance.ANNULEE);
                echeanceRepo.save(echeance);
            }
        }
    }

    /**
     * Met à jour le statut d'un échéancier (vérifie si toutes les échéances sont payées)
     */
    @Transactional
    public void verifierEtMettreAJourStatut(Long echeancierId) {
        Echeancier echeancier = echeancierRepo.findById(echeancierId)
                .orElseThrow(() -> new EcheancierNotFoundException(echeancierId));

        boolean toutesPayees = echeancier.getEcheances().stream()
                .allMatch(e -> e.getStatut() == StatutEcheance.PAYEE);

        if (toutesPayees) {
            echeancier.setStatut(StatutEcheancier.TERMINE);
            echeancierRepo.save(echeancier);
        }
    }
}