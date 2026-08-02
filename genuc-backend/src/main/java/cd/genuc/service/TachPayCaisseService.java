package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.StatutAffectation;
import cd.genuc.model.Paiement.StatutPaiement;
import cd.genuc.repository.*;
import cd.genuc.service.tachpay.TachPayPaiementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TachPayCaisseService {

    private final BonDePaiementRepository bonRepo;
    private final PaiementRepository paiementRepo;
    private final AffectationFraisRepository affectationRepo;
    private final InscriptionRepository inscriptionRepo;
    private final TachPayPaiementService paiementService;

    public Map<String, Object> verifierBon(String numero) {
        BonDePaiement bon = bonRepo.findByNumero(numero)
            .orElseThrow(() -> new RuntimeException("Bon introuvable"));

        return Map.of(
            "numero", bon.getNumero(),
            "etudiant", bon.getInscription().getPrenom() + " " + bon.getInscription().getNom(),
            "matricule", bon.getInscription().getMatricule(),
            "montant", bon.getMontant(),
            "dateEmission", bon.getDateEmission().toString(),
            "dateExpiration", bon.getDateExpiration().toString(),
            "utilise", bon.isUtilise(),
            "expire", bon.estExpire(),
            "statut", bon.estUtilisable() ? "VALIDE" : "INVALIDE"
        );
    }

    @Transactional
    public Map<String, Object> validerBonDePaiement(String numero, Long caissierId) {
        Paiement paiement = paiementService.validerBonDePaiement(numero, caissierId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Bon validé avec succès");
        result.put("reference", paiement.getReference());
        result.put("montant", paiement.getMontant());
        result.put("statut", paiement.getStatut().name());
        return result;
    }

    @Transactional
    public Map<String, Object> enregistrerPaiementEspeces(Long inscriptionId, List<Long> affectationIds,
                                                          Double montant, Long caissierId) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        List<AffectationFrais> affectations = affectationRepo.findAllById(affectationIds).stream()
                .filter(af -> af.getInscription().getId().equals(inscriptionId))
                .filter(af -> af.getStatut() != StatutAffectation.PAYE && af.getStatut() != StatutAffectation.ANNULE)
                .collect(Collectors.toList());

        if (affectations.isEmpty()) {
            throw new RuntimeException("Aucune affectation valide sélectionnée");
        }

        double totalReste = affectations.stream().mapToDouble(AffectationFrais::getReste).sum();
        if (montant <= 0) {
            throw new RuntimeException("Le montant doit être supérieur à zéro");
        }
        if (montant > totalReste) {
            throw new RuntimeException("Le montant dépasse le total dû");
        }

        Paiement paiement = Paiement.builder()
                .montant(montant)
                .devise("USD")
                .modePaiement(Paiement.ModePaiement.ESPECES)
                .statut(StatutPaiement.VALIDE)
                .type(Paiement.TypePaiement.FRAIS_ACADEMIQUES)
                .datePaiement(LocalDate.now())
                .dateValidation(LocalDate.now())
                .agentId(caissierId)
                .inscription(inscription)
                .universite(inscription.getUniversite())
                .notesCaisse("Paiement en espèces")
                .build();

        paiement = paiementRepo.save(paiement);

        double resteAPayer = montant;
        for (AffectationFrais af : affectations) {
            if (resteAPayer <= 0) {
                break;
            }
            double montantAffecte = Math.min(af.getReste(), resteAPayer);
            af.appliquerPaiement(montantAffecte);
            affectationRepo.save(af);
            resteAPayer -= montantAffecte;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Paiement en espèces enregistré");
        result.put("reference", paiement.getReference());
        result.put("montant", paiement.getMontant());
        result.put("statut", paiement.getStatut().name());
        return result;
    }

    public Map<String, Object> getOperationsDuJour(Long universiteId) {
        List<Paiement> paiements = paiementRepo.paiementsDuJour(universiteId, LocalDate.now());

        List<Map<String, Object>> operations = paiements.stream()
                .map(p -> {
                    Map<String, Object> op = new LinkedHashMap<>();
                    op.put("id", p.getId());
                    op.put("reference", p.getReference());
                    op.put("montant", p.getMontant());
                    op.put("modePaiement", p.getModePaiement().name());
                    op.put("statut", p.getStatut().name());
                    op.put("agentId", p.getAgentId());
                    if (p.getInscription() != null) {
                        op.put("etudiant", p.getInscription().getPrenom() + " " + p.getInscription().getNom());
                        op.put("matricule", p.getInscription().getMatricule());
                    }
                    return op;
                })
                .collect(Collectors.toList());

        double total = paiements.stream()
                .filter(p -> p.getStatut() == StatutPaiement.VALIDE)
                .mapToDouble(Paiement::getMontant)
                .sum();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date", LocalDate.now().toString());
        result.put("nombre", operations.size());
        result.put("total", total);
        result.put("operations", operations);
        return result;
    }

    public Map<String, Object> annulerBon(String numero, String motif) {
        BonDePaiement bon = bonRepo.findByNumero(numero)
            .orElseThrow(() -> new RuntimeException("Bon introuvable"));

        if (bon.isUtilise()) {
            throw new RuntimeException("Impossible d'annuler un bon déjà utilisé");
        }

        bon.setDateExpiration(LocalDate.now().minusDays(1));
        bonRepo.save(bon);

        return Map.of("message", "Bon annulé avec succès", "motif", motif);
    }
}
