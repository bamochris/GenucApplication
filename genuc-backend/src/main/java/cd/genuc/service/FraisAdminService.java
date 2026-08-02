// src/main/java/cd/genuc/service/FraisAdminService.java
package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.StatutAffectation;
import cd.genuc.model.Frais.StatutFrais;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraisAdminService {

    private final CategorieFraisRepository categorieRepo;
    private final FraisRepository fraisRepo;
    private final AffectationFraisRepository affectationRepo;
    private final InscriptionRepository inscriptionRepo;
    private final PromotionRepository promotionRepo;
    private final UniversiteRepository universiteRepo;

    // ─── CATÉGORIES ──────────────────────────────────────────────

    public List<CategorieFrais> getCategories(Long universiteId) {
        return categorieRepo.findByUniversiteIdAndActifTrue(universiteId);
    }

    public CategorieFrais getCategorie(Long id) {
        return categorieRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
    }

    @Transactional
    public CategorieFrais creerCategorie(CategorieFrais categorie) {
        if (categorieRepo.existsByCodeAndUniversiteId(categorie.getCode(), categorie.getUniversite().getId())) {
            throw new RuntimeException("Une catégorie avec ce code existe déjà");
        }
        return categorieRepo.save(categorie);
    }

    @Transactional
    public CategorieFrais modifierCategorie(Long id, CategorieFrais details) {
        CategorieFrais cat = getCategorie(id);
        cat.setDesignation(details.getDesignation());
        cat.setDescription(details.getDescription());
        cat.setActif(details.isActif());
        return categorieRepo.save(cat);
    }

    @Transactional
    public void desactiverCategorie(Long id) {
        CategorieFrais cat = getCategorie(id);
        cat.setActif(false);
        categorieRepo.save(cat);
    }

    // ─── FRAIS ──────────────────────────────────────────────────

    public List<Frais> getFrais(Long universiteId, String annee) {
        if (annee != null && !annee.isEmpty()) {
            return fraisRepo.findByUniversiteIdAndAnneeAcademique(universiteId, annee);
        }
        return fraisRepo.findByUniversiteId(universiteId);
    }

    public Frais getFrais(Long id) {
        return fraisRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Frais introuvable"));
    }

    @Transactional
    public Frais creerFrais(Frais frais) {
        if (fraisRepo.existsByCodeAndUniversiteId(frais.getCode(), frais.getUniversite().getId())) {
            throw new RuntimeException("Un frais avec ce code existe déjà");
        }

        // Vérifier que la promotion existe
        Promotion promotion = promotionRepo.findById(frais.getPromotionId())
                .orElseThrow(() -> new RuntimeException("Promotion introuvable"));

        // Vérifier que la catégorie existe
        CategorieFrais categorie = categorieRepo.findById(frais.getCategorie().getId())
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        frais.setCategorie(categorie);
        Frais saved = fraisRepo.save(frais);

        // Affectation automatique aux étudiants de la promotion
        affecterFraisAuxEtudiants(saved);

        log.info("Frais créé et affecté à la promotion {} : {} - {} USD", 
                promotion.getLibelle(), saved.getCode(), saved.getMontant());

        return saved;
    }

    @Transactional
    public Frais modifierFrais(Long id, Frais details) {
        Frais frais = getFrais(id);
        frais.setLibelle(details.getLibelle());
        frais.setMontant(details.getMontant());
        frais.setDevise(details.getDevise());
        frais.setAnneeAcademique(details.getAnneeAcademique());
        frais.setDateLimite(details.getDateLimite());
        frais.setDescription(details.getDescription());
        frais.setType(details.getType());
        frais.setFaculteId(details.getFaculteId());
        frais.setPromotionId(details.getPromotionId());
        frais.setStatut(details.getStatut());
        return fraisRepo.save(frais);
    }

    @Transactional
    public void desactiverFrais(Long id) {
        Frais frais = getFrais(id);
        frais.setStatut(StatutFrais.INACTIF);
        fraisRepo.save(frais);
        // Annuler les affectations non payées
        List<AffectationFrais> affectations = affectationRepo.findByFraisId(id);
        for (AffectationFrais af : affectations) {
            if (af.getStatut() != StatutAffectation.PAYE) {
                af.annuler();
                affectationRepo.save(af);
            }
        }
        log.info("Frais {} désactivé et affectations annulées", frais.getCode());
    }

    @Transactional
    public void archiverFrais(Long id) {
        Frais frais = getFrais(id);
        frais.setStatut(StatutFrais.ARCHIVE);
        fraisRepo.save(frais);
    }

    // ─── AFFECTATION AUTOMATIQUE ──────────────────────────────

    /**
     * Affecte un frais à tous les étudiants d'une promotion
     */
    @Transactional
    public void affecterFraisAuxEtudiants(Frais frais) {
        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(frais.getPromotionId());

        if (inscriptions.isEmpty()) {
            log.warn("Aucun étudiant trouvé pour la promotion ID: {}", frais.getPromotionId());
            return;
        }

        Promotion promotion = promotionRepo.findById(frais.getPromotionId())
                .orElseThrow(() -> new RuntimeException("Promotion introuvable"));

        List<AffectationFrais> affectations = new ArrayList<>();
        for (Inscription ins : inscriptions) {
            AffectationFrais af = AffectationFrais.builder()
                    .frais(frais)
                    .inscription(ins)
                    .promotion(promotion)
                    .montant(frais.getMontant())
                    .reste(frais.getMontant())
                    .dateEcheance(frais.getDateLimite())
                    .statut(StatutAffectation.EN_ATTENTE)
                    .build();
            affectations.add(af);
        }

        affectationRepo.saveAll(affectations);
        log.info("{} affectations créées pour le frais {} (promotion {})", 
                affectations.size(), frais.getCode(), frais.getPromotionId());
    }

    /**
     * Réaffecte un frais à une promotion (si des étudiants ont été ajoutés)
     */
    @Transactional
    public void reaffecterFrais(Long fraisId) {
        Frais frais = getFrais(fraisId);
        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(frais.getPromotionId());

        // Récupérer les affectations existantes
        List<AffectationFrais> existantes = affectationRepo.findByFraisId(fraisId);
        List<Long> idsExistants = existantes.stream()
                .map(af -> af.getInscription().getId())
                .collect(Collectors.toList());

        Promotion promotion = promotionRepo.findById(frais.getPromotionId())
                .orElseThrow(() -> new RuntimeException("Promotion introuvable"));

        int ajoutes = 0;
        for (Inscription ins : inscriptions) {
            if (!idsExistants.contains(ins.getId())) {
                AffectationFrais af = AffectationFrais.builder()
                        .frais(frais)
                        .inscription(ins)
                        .promotion(promotion)
                        .montant(frais.getMontant())
                        .reste(frais.getMontant())
                        .dateEcheance(frais.getDateLimite())
                        .statut(StatutAffectation.EN_ATTENTE)
                        .build();
                affectationRepo.save(af);
                ajoutes++;
            }
        }
        log.info("{} nouvelles affectations ajoutées pour le frais {}", ajoutes, frais.getCode());
    }

    // ─── AFFECTATION INDIVIDUELLE (frais exceptionnel) ──────────

    @Transactional
    public AffectationFrais affecterFraisIndividuel(Long fraisId, Long inscriptionId) {
        Frais frais = getFrais(fraisId);
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        // Vérifier si une affectation existe déjà pour ce frais et cette inscription
        List<AffectationFrais> existantes = affectationRepo.findByFraisId(fraisId);
        for (AffectationFrais af : existantes) {
            if (af.getInscription().getId().equals(inscriptionId) && af.getStatut() != StatutAffectation.ANNULE) {
                throw new RuntimeException("Ce frais est déjà affecté à cet étudiant");
            }
        }

        Promotion promotion = promotionRepo.findById(frais.getPromotionId())
                .orElseThrow(() -> new RuntimeException("Promotion introuvable"));

        AffectationFrais af = AffectationFrais.builder()
                .frais(frais)
                .inscription(inscription)
                .promotion(promotion)
                .montant(frais.getMontant())
                .reste(frais.getMontant())
                .dateEcheance(frais.getDateLimite())
                .statut(StatutAffectation.EN_ATTENTE)
                .build();

        log.info("Affectation individuelle du frais {} à l'étudiant {}", frais.getCode(), inscription.getMatricule());
        return affectationRepo.save(af);
    }

    // ─── HISTORIQUE ──────────────────────────────────────────────

    public List<AffectationFrais> getHistoriqueAffectations(Long universiteId, Long inscriptionId) {
        if (inscriptionId != null) {
            return affectationRepo.findByInscriptionId(inscriptionId);
        }
        return affectationRepo.findDettesActivesByUniversite(universiteId);
    }

    public Map<String, Object> getStatistiquesFrais(Long universiteId, String annee) {
        List<Frais> frais = fraisRepo.findByUniversiteIdAndAnneeAcademique(universiteId, annee);
        long totalFrais = frais.size();
        long totalActifs = frais.stream().filter(f -> f.getStatut() == StatutFrais.ACTIF).count();
        double montantTotal = frais.stream().mapToDouble(Frais::getMontant).sum();

        List<AffectationFrais> affectations = affectationRepo.findDettesActivesByUniversite(universiteId);
        long totalAffectations = affectations.size();
        double totalDettes = affectations.stream().mapToDouble(AffectationFrais::getReste).sum();

        return Map.of(
                "totalFrais", totalFrais,
                "totalActifs", totalActifs,
                "montantTotal", montantTotal,
                "totalAffectations", totalAffectations,
                "totalDettes", totalDettes,
                "annee", annee
        );
    }
}