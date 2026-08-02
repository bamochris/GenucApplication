package cd.genuc.service;

import cd.genuc.exception.BusinessException;
import cd.genuc.exception.EcheanceNotFoundException;
import cd.genuc.exception.EcheancierNotFoundException;
import cd.genuc.model.*;
import cd.genuc.model.Echeance.StatutEcheance;
import cd.genuc.model.Echeancier.StatutEcheancier;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EcheancePaiementService {

    private final EcheanceRepository echeanceRepo;
    private final EcheancierRepository echeancierRepo;
    private final PaiementRepository paiementRepo;
    private final EcheancierService echeancierService;

    /**
     * Payer une échéance spécifique
     */
    @Transactional
    public Paiement payerEcheance(Long echeanceId, Map<String, Object> data) {
        Echeance echeance = echeanceRepo.findById(echeanceId)
                .orElseThrow(() -> new EcheanceNotFoundException(echeanceId));

        if (echeance.getStatut() == StatutEcheance.PAYEE) {
            throw new BusinessException("ECHEANCE_DEJA_PAYEE", "Cette échéance est déjà payée");
        }

        Echeancier echeancier = echeance.getEcheancier();
        double montant = echeance.getMontant() + echeance.getPenalite();

        // Créer le paiement
        Paiement paiement = Paiement.builder()
                .reference(genererReference())
                .montant(Math.round(montant * 100.0) / 100.0)
                .devise("USD")
                .modePaiement(Paiement.ModePaiement.valueOf(data.get("modePaiement").toString()))
                .statut(Paiement.StatutPaiement.VALIDE)
                .type(Paiement.TypePaiement.FRAIS_ACADEMIQUES)
                .datePaiement(LocalDate.now())
                .dateValidation(LocalDate.now())
                .numeroTransaction((String) data.get("numeroTransaction"))
                .operateur((String) data.get("operateur"))
                .inscription(echeancier.getInscription())
                .universite(echeancier.getUniversite())
                .agentId(data.get("agentId") != null ? Long.valueOf(data.get("agentId").toString()) : null)
                .build();

        paiement = paiementRepo.save(paiement);

        echeance.setStatut(StatutEcheance.PAYEE);
        echeance.setDatePaiement(LocalDate.now());
        echeance.setPaiement(paiement);
        echeanceRepo.save(echeance);

        echeancierService.verifierEtMettreAJourStatut(echeancier.getId());

        return paiement;
    }

    /**
     * Payer plusieurs échéances en une seule transaction
     */
    @Transactional
    public Paiement payerEcheances(Long echeancierId, List<Long> echeanceIds, Map<String, Object> data) {
        Echeancier echeancier = echeancierRepo.findById(echeancierId)
                .orElseThrow(() -> new EcheancierNotFoundException(echeancierId));

        double totalMontant = 0;
        int nbPayees = 0;

        for (Long id : echeanceIds) {
            Echeance echeance = echeanceRepo.findById(id)
                    .orElseThrow(() -> new EcheanceNotFoundException(id));

            if (!echeance.getEcheancier().getId().equals(echeancierId)) {
                throw new BusinessException("L'échéance " + id + " n'appartient pas à cet échéancier");
            }

            if (echeance.getStatut() == StatutEcheance.PAYEE) {
                continue;
            }

            totalMontant += echeance.getMontant() + echeance.getPenalite();
            echeance.setStatut(StatutEcheance.PAYEE);
            echeance.setDatePaiement(LocalDate.now());
            echeanceRepo.save(echeance);
            nbPayees++;
        }

        if (nbPayees == 0) {
            throw new BusinessException("Aucune échéance à payer");
        }

        Paiement paiement = Paiement.builder()
                .reference(genererReference())
                .montant(Math.round(totalMontant * 100.0) / 100.0)
                .devise("USD")
                .modePaiement(Paiement.ModePaiement.valueOf(data.get("modePaiement").toString()))
                .statut(Paiement.StatutPaiement.VALIDE)
                .type(Paiement.TypePaiement.FRAIS_ACADEMIQUES)
                .datePaiement(LocalDate.now())
                .dateValidation(LocalDate.now())
                .numeroTransaction((String) data.get("numeroTransaction"))
                .operateur((String) data.get("operateur"))
                .inscription(echeancier.getInscription())
                .universite(echeancier.getUniversite())
                .agentId(data.get("agentId") != null ? Long.valueOf(data.get("agentId").toString()) : null)
                .build();

        paiement = paiementRepo.save(paiement);

        for (Long id : echeanceIds) {
            Echeance echeance = echeanceRepo.findById(id).orElse(null);
            if (echeance != null && echeance.getStatut() == StatutEcheance.PAYEE) {
                echeance.setPaiement(paiement);
                echeanceRepo.save(echeance);
            }
        }

        echeancierService.verifierEtMettreAJourStatut(echeancierId);

        return paiement;
    }

    /**
     * Situation d'un échéancier : total, payé, restant, pénalités
     */
    public Map<String, Object> getSituationEcheancier(Long echeancierId) {
        Echeancier echeancier = echeancierRepo.findById(echeancierId)
                .orElseThrow(() -> new EcheancierNotFoundException(echeancierId));

        double totalPaye = 0;
        double totalPenalites = 0;
        int nbPayees = 0;
        int nbEnAttente = 0;
        int nbEnRetard = 0;

        for (Echeance e : echeancier.getEcheances()) {
            if (e.getStatut() == StatutEcheance.PAYEE) {
                totalPaye += e.getMontant();
                nbPayees++;
            } else {
                totalPenalites += e.getPenalite();
                if (e.getStatut() == StatutEcheance.EN_RETARD) {
                    nbEnRetard++;
                } else {
                    nbEnAttente++;
                }
            }
        }

        double restant = echeancier.getMontantTotal() - totalPaye;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("echeancierId", echeancierId);
        result.put("libelle", echeancier.getLibelle());
        result.put("montantTotal", echeancier.getMontantTotal());
        result.put("totalPaye", Math.round(totalPaye * 100.0) / 100.0);
        result.put("restant", Math.round(restant * 100.0) / 100.0);
        result.put("penalites", Math.round(totalPenalites * 100.0) / 100.0);
        result.put("nbEcheances", echeancier.getNombreEcheances());
        result.put("nbPayees", nbPayees);
        result.put("nbEnAttente", nbEnAttente);
        result.put("nbEnRetard", nbEnRetard);
        result.put("statut", echeancier.getStatut().name());

        return result;
    }

    /**
     * Liste les échéances en retard (non payées, date dépassée) pour une université,
     * triées par date d'échéance croissante (les plus anciennes en premier).
     */
    public List<Echeance> echeancesARecouvrer(Long universiteId) {
        return echeanceRepo.findARecouvrerParUniversite(universiteId, LocalDate.now());
    }

    private String genererReference() {
        int annee = LocalDate.now().getYear();
        long seq = paiementRepo.countParAnnee(annee) + 1;
        return String.format("ECH-%d-%05d", annee, seq);
    }
}