// src/main/java/cd/genuc/service/FraisEtudiantService.java
package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.StatutAffectation;
import cd.genuc.model.Paiement.StatutPaiement;
import cd.genuc.repository.*;
import cd.genuc.util.PdfGenerateur;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraisEtudiantService {

    private final AffectationFraisRepository affectationRepo;
    private final PaiementRepository paiementRepo;
    private final InscriptionRepository inscriptionRepo;
    private final FraisRepository fraisRepo;
    private final PdfGenerateur pdfGenerateur;

    // ─── SITUATION FINANCIÈRE DE L'ÉTUDIANT ────────────────────

    public Map<String, Object> getSituationFinanciere(Long inscriptionId) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        // Seuls les frais attribués par l'admin pour la promotion + année de
        // cette inscription sont pris en compte (affichage et totaux).
        List<AffectationFrais> affectations = affectationRepo.findByInscriptionId(inscriptionId).stream()
                .filter(af -> estAttribuePourPromotionEtAnnee(af, inscription))
                .collect(Collectors.toList());

        double totalAttendu = affectations.stream()
                .filter(af -> af.getStatut() != StatutAffectation.ANNULE)
                .mapToDouble(AffectationFrais::getMontant)
                .sum();

        double totalPaye = affectations.stream()
                .filter(af -> af.getStatut() == StatutAffectation.PAYE)
                .mapToDouble(AffectationFrais::getMontant)
                .sum();

        double totalReste = affectations.stream()
                .filter(af -> af.getStatut() != StatutAffectation.ANNULE)
                .mapToDouble(AffectationFrais::getReste)
                .sum();

        List<Map<String, Object>> dettes = affectations.stream()
                .filter(af -> af.getStatut() == StatutAffectation.EN_ATTENTE || af.getStatut() == StatutAffectation.PARTIEL)
                .map(af -> {
                    Map<String, Object> d = new LinkedHashMap<>();
                    d.put("id", af.getId());
                    d.put("fraisCode", af.getFrais().getCode());
                    d.put("fraisLibelle", af.getFrais().getLibelle());
                    d.put("montant", af.getMontant());
                    d.put("reste", af.getReste());
                    d.put("statut", af.getStatut().name());
                    d.put("dateEcheance", af.getDateEcheance());
                    d.put("estEnRetard", af.getDateEcheance() != null && af.getDateEcheance().isBefore(LocalDate.now()));
                    return d;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> paiements = paiementRepo.findByInscriptionId(inscriptionId).stream()
                .filter(p -> p.getStatut() == StatutPaiement.VALIDE)
                .map(p -> {
                    Map<String, Object> pm = new LinkedHashMap<>();
                    pm.put("id", p.getId());
                    pm.put("reference", p.getReference());
                    pm.put("montant", p.getMontant());
                    pm.put("datePaiement", p.getDatePaiement());
                    pm.put("modePaiement", p.getModePaiement().name());
                    pm.put("type", p.getType().name());
                    return pm;
                })
                .collect(Collectors.toList());

        double pourcentage = totalAttendu > 0 ? (totalPaye / totalAttendu) * 100 : 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("inscriptionId", inscriptionId);
        result.put("matricule", inscription.getMatricule());
        result.put("etudiant", inscription.getPrenom() + " " + inscription.getNom());
        result.put("totalAttendu", totalAttendu);
        result.put("totalPaye", totalPaye);
        result.put("totalReste", totalReste);
        result.put("pourcentage", Math.round(pourcentage));
        result.put("estSolde", totalReste == 0);
        result.put("dettes", dettes);
        result.put("paiements", paiements);

        return result;
    }

    // ─── FRAIS À PAYER ──────────────────────────────────────────

    public List<Map<String, Object>> getFraisAPayer(Long inscriptionId) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));
        List<AffectationFrais> affectations = affectationRepo.findDettesActivesByInscription(inscriptionId);

        return affectations.stream()
                // Seuls les frais attribués pour la promotion + année de l'étudiant
                .filter(af -> estAttribuePourPromotionEtAnnee(af, inscription))
                .map(af -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("id", af.getId());
            d.put("fraisId", af.getFrais().getId());
            d.put("code", af.getFrais().getCode());
            d.put("libelle", af.getFrais().getLibelle());
            d.put("montant", af.getMontant());
            d.put("reste", af.getReste());
            d.put("paye", af.getMontantPaye());
            d.put("statut", af.getStatut().name());
            d.put("dateEcheance", af.getDateEcheance());
            d.put("estEnRetard", af.getDateEcheance() != null && af.getDateEcheance().isBefore(LocalDate.now()));
            d.put("type", af.getFrais().getType() != null ? af.getFrais().getType().name() : "AUTRE");
            return d;
        }).collect(Collectors.toList());
    }

    // ─── FILTRE PROMOTION + ANNÉE ───────────────────────────────

    /**
     * Un frais ne doit apparaître dans le portail étudiant que si l'admin l'a
     * attribué pour LA promotion ET L'année académique de l'inscription courante.
     * Tout autre frais (attribué individuellement à une autre promotion/année,
     * reliquat migré, etc.) est masqué du portail et des totaux.
     */
    private boolean estAttribuePourPromotionEtAnnee(AffectationFrais af, Inscription inscription) {
        Frais frais = af.getFrais();
        if (frais == null || inscription == null) {
            return false;
        }

        // 1. Même promotion (une promotion est déjà datée : une seule année académique).
        Long promotionInscription = inscription.getPromotion() != null
                ? inscription.getPromotion().getId() : null;
        if (frais.getPromotionId() == null
                || !frais.getPromotionId().equals(promotionInscription)) {
            return false;
        }

        // 2. Même année académique (comparaison normalisée sur les chiffres).
        //    Si un libellé est absent, la promotion (déjà datée) fait foi.
        String anneeInscription = inscription.getAnneeAcademique() != null
                ? inscription.getAnneeAcademique().getLibelle() : null;
        String anneeFrais = frais.getAnneeAcademique();
        if (anneeInscription == null || anneeFrais == null) {
            return true;
        }
        return normaliserAnnee(anneeFrais).equals(normaliserAnnee(anneeInscription));
    }

    private String normaliserAnnee(String annee) {
        return annee == null ? "" : annee.replaceAll("[^0-9]", "");
    }

    // ─── GÉNÉRATION DE REÇU AVEC QR CODE ────────────────────────

    public byte[] genererRecu(Long paiementId) throws Exception {
        Paiement paiement = paiementRepo.findById(paiementId)
                .orElseThrow(() -> new RuntimeException("Paiement introuvable"));

        if (paiement.getStatut() != StatutPaiement.VALIDE) {
            throw new RuntimeException("Le paiement doit être validé pour générer un reçu");
        }

        Inscription inscription = paiement.getInscription();
        Universite universite = paiement.getUniversite();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("universite", universite.getNom());
        data.put("universiteCode", universite.getCode());
        data.put("reference", paiement.getReference());
        data.put("date", paiement.getDateValidation() != null ? paiement.getDateValidation().toString() : paiement.getDatePaiement().toString());
        data.put("etudiant", inscription.getPrenom() + " " + inscription.getNom());
        data.put("matricule", inscription.getMatricule());
        data.put("montant", paiement.getMontant());
        data.put("devise", paiement.getDevise());
        data.put("modePaiement", paiement.getModePaiement().name());
        data.put("typePaiement", paiement.getType().name());
        data.put("operateur", paiement.getOperateur() != null ? paiement.getOperateur() : "-");
        data.put("numeroTransaction", paiement.getNumeroTransaction() != null ? paiement.getNumeroTransaction() : "-");
        data.put("agentId", paiement.getAgentId() != null ? paiement.getAgentId().toString() : "-");
        data.put("genereA", LocalDate.now().toString());

        // Récupérer les affectations liées
        List<AffectationFrais> affectations = affectationRepo.findByPaiementId(paiementId);
        List<String> detailsFrais = affectations.stream()
                .map(af -> af.getFrais().getLibelle() + " (" + af.getMontant() + " USD)")
                .collect(Collectors.toList());
        data.put("detailsFrais", detailsFrais);

        // QR Code avec la référence pour vérification
        String qrContent = "https://genuc.cd/verifier-recu/" + paiement.getReference();
        data.put("qrContent", qrContent);

        return pdfGenerateur.genererRecuPaiement(data);
    }

    // ─── HISTORIQUE DES PAIEMENTS ──────────────────────────────

    public List<Map<String, Object>> getHistoriquePaiements(Long inscriptionId) {
        return paiementRepo.findByInscriptionId(inscriptionId).stream()
                .map(p -> {
                    Map<String, Object> pm = new LinkedHashMap<>();
                    pm.put("id", p.getId());
                    pm.put("reference", p.getReference());
                    pm.put("montant", p.getMontant());
                    pm.put("devise", p.getDevise());
                    pm.put("datePaiement", p.getDatePaiement());
                    pm.put("dateValidation", p.getDateValidation());
                    pm.put("modePaiement", p.getModePaiement().name());
                    pm.put("type", p.getType().name());
                    pm.put("statut", p.getStatut().name());
                    pm.put("operateur", p.getOperateur());
                    pm.put("numeroTransaction", p.getNumeroTransaction());
                    return pm;
                })
                .collect(Collectors.toList());
    }
}