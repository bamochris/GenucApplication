package cd.genuc.service.tachpay;

import cd.genuc.model.*;
import cd.genuc.config.cache.CacheNames;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TachPayAdminService {

    private final FraisRepository fraisRepo;
    private final AffectationFraisRepository affectationRepo;
    private final InscriptionRepository inscriptionRepo;
    private final PromotionRepository promotionRepo;
    private final UniversiteRepository universiteRepo;
    private final CategorieFraisRepository categorieRepo;

    // ─── CRUD Frais ──────────────────────────────────────────────────────

    @Transactional
    public Frais creerFrais(Map<String, Object> data, Long universiteId) {
        String code = ((String) data.get("code")).toUpperCase().trim();
        if (fraisRepo.existsByCodeAndUniversiteId(code, universiteId)) {
            throw new RuntimeException("Un frais avec ce code existe déjà");
        }

        Universite uni = universiteRepo.findById(universiteId)
                .orElseThrow(() -> new RuntimeException("Université introuvable"));

        // Validation de la promotion
        Long promotionId = Long.valueOf(data.get("promotionId").toString());
        Promotion promotion = promotionRepo.findById(promotionId)
                .orElseThrow(() -> new RuntimeException("Promotion introuvable"));

        // Catégorie
        CategorieFrais categorie = null;
        if (data.containsKey("categorieId")) {
            categorie = categorieRepo.findById(Long.valueOf(data.get("categorieId").toString()))
                    .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
        }

        Frais frais = Frais.builder()
                .code(code)
                .libelle((String) data.get("libelle"))
                .montant(Double.valueOf(data.get("montant").toString()))
                .devise(data.getOrDefault("devise", "USD").toString())
                .categorie(categorie)
                .anneeAcademique(anneeDePromotion(promotion, (String) data.get("anneeAcademique")))
                .promotionId(promotionId)
                .faculteId(data.get("faculteId") != null ? Long.valueOf(data.get("faculteId").toString()) : null)
                .dateLimite(data.get("dateLimite") != null ? LocalDate.parse((String) data.get("dateLimite")) : null)
                .description((String) data.get("description"))
                .type(data.get("type") != null ? Frais.TypeFrais.valueOf((String) data.get("type")) : Frais.TypeFrais.ACADEMIQUE)
                .universite(uni)
                .statut(Frais.StatutFrais.ACTIF)
                // Canaux ouverts pour ce frais, choisis par l'admin au moment de
                // l'affectation. Absents du corps de requête = aucune restriction.
                .modesPaiementAutorises(lireModes(data))
                .banquesAutorisees(lireBanques(data))
                .build();

        Frais saved = fraisRepo.save(frais);

        // Affectation automatique aux étudiants de la promotion
        affecterFraisAuxEtudiants(saved);

        log.info("Frais créé : {} pour la promotion {} ({} étudiants)", saved.getCode(), promotion.getLibelle(), 
                inscriptionRepo.findByPromotionId(promotionId).size());

        return saved;
    }

    /**
     * Modes de paiement acceptés pour ce frais. L'admin peut en activer plusieurs.
     *
     * <p>Une valeur inconnue est ignorée plutôt que de faire échouer la création du
     * frais : le référentiel des modes peut s'enrichir côté serveur avant que le
     * frontend ne soit redéployé.</p>
     */
    private java.util.Set<cd.genuc.model.Paiement.ModePaiement> lireModes(Map<String, Object> data) {
        java.util.Set<cd.genuc.model.Paiement.ModePaiement> modes = new java.util.LinkedHashSet<>();
        Object brut = data.get("modesPaiementAutorises");
        if (brut instanceof java.util.Collection<?> valeurs) {
            for (Object v : valeurs) {
                if (v == null) continue;
                try {
                    modes.add(cd.genuc.model.Paiement.ModePaiement.valueOf(v.toString().trim().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    log.warn("Mode de paiement inconnu ignoré à la création du frais : {}", v);
                }
            }
        }
        return modes;
    }

    /** Comptes bancaires sur lesquels ce frais peut être réglé (plusieurs possibles). */
    private java.util.Set<Long> lireBanques(Map<String, Object> data) {
        java.util.Set<Long> banques = new java.util.LinkedHashSet<>();
        Object brut = data.get("banquesAutorisees");
        if (brut instanceof java.util.Collection<?> valeurs) {
            for (Object v : valeurs) {
                if (v == null) continue;
                try {
                    banques.add(Long.valueOf(v.toString().trim()));
                } catch (NumberFormatException e) {
                    log.warn("Identifiant de compte bancaire invalide ignoré : {}", v);
                }
            }
        }
        return banques;
    }

    /** L'année académique d'un frais suit celle de sa promotion (source de vérité). */
    private String anneeDePromotion(Promotion promotion, String fallback) {
        if (promotion != null && promotion.getAnneeAcademique() != null
                && promotion.getAnneeAcademique().getLibelle() != null) {
            return promotion.getAnneeAcademique().getLibelle();
        }
        return fallback;
    }

    @Transactional
    public Frais modifierFrais(Long id, Map<String, Object> data) {
        Frais frais = getFrais(id);

        if (data.containsKey("libelle")) frais.setLibelle((String) data.get("libelle"));
        if (data.containsKey("montant")) frais.setMontant(Double.valueOf(data.get("montant").toString()));
        if (data.containsKey("devise")) frais.setDevise((String) data.get("devise"));
        if (data.containsKey("dateLimite") && data.get("dateLimite") != null) {
            frais.setDateLimite(LocalDate.parse((String) data.get("dateLimite")));
        }
        if (data.containsKey("description")) frais.setDescription((String) data.get("description"));
        if (data.containsKey("type") && data.get("type") != null) {
            frais.setType(Frais.TypeFrais.valueOf((String) data.get("type")));
        }
        if (data.containsKey("faculteId")) {
            frais.setFaculteId(data.get("faculteId") != null ? Long.valueOf(data.get("faculteId").toString()) : null);
        }
        if (data.containsKey("promotionId")) {
            frais.setPromotionId(Long.valueOf(data.get("promotionId").toString()));
        }
        // Canaux de paiement : remplacés en bloc quand la clé est présente, de sorte
        // qu'un admin puisse aussi RETIRER un mode ou une banque en renvoyant la
        // liste amputée (un simple addAll ne le permettrait pas).
        if (data.containsKey("modesPaiementAutorises")) {
            frais.setModesPaiementAutorises(lireModes(data));
        }
        if (data.containsKey("banquesAutorisees")) {
            frais.setBanquesAutorisees(lireBanques(data));
        }
        // L'année académique suit toujours la promotion (une promotion appartient à
        // une seule année) : évite qu'un frais soit enregistré pour une année autre
        // que celle des inscriptions ciblées, sinon il reste invisible côté étudiant.
        Promotion promoActuelle = promotionRepo.findById(frais.getPromotionId()).orElse(null);
        frais.setAnneeAcademique(anneeDePromotion(promoActuelle,
                data.containsKey("anneeAcademique") ? (String) data.get("anneeAcademique") : frais.getAnneeAcademique()));
        if (data.containsKey("categorieId") && data.get("categorieId") != null) {
            CategorieFrais cat = categorieRepo.findById(Long.valueOf(data.get("categorieId").toString()))
                    .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
            frais.setCategorie(cat);
        }

        return fraisRepo.save(frais);
    }

    @Transactional
    public Frais changerStatut(Long id, Frais.StatutFrais statut) {
        Frais frais = getFrais(id);
        frais.setStatut(statut);

        // Si désactivation, annuler les affectations non payées
        if (statut == Frais.StatutFrais.INACTIF || statut == Frais.StatutFrais.ARCHIVE) {
            List<AffectationFrais> affectations = affectationRepo.findByFraisId(id);
            for (AffectationFrais af : affectations) {
                if (af.getStatut() != StatutAffectation.PAYE) {
                    af.annuler();
                    affectationRepo.save(af);
                }
            }
            log.info("Frais {} désactivé, affectations non payées annulées", frais.getCode());
        }

        return fraisRepo.save(frais);
    }

    @Transactional
    public void supprimerFrais(Long id) {
        Frais frais = getFrais(id);
        if (frais.getStatut() == Frais.StatutFrais.ACTIF) {
            throw new RuntimeException("Impossible de supprimer un frais actif. Désactivez-le d'abord.");
        }
        fraisRepo.delete(frais);
        log.info("Frais {} supprimé définitivement", frais.getCode());
    }

    @Cacheable(value = CacheNames.FRAIS, key = "#id")
    public Frais getFrais(Long id) {
        return fraisRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Frais introuvable"));
    }

    public Frais getFrais(Long id, Long universiteId) {
        Frais frais = getFrais(id);
        verifierUniversite(frais, universiteId);
        return frais;
    }

    @Transactional
    public Frais modifierFrais(Long id, Map<String, Object> data, Long universiteId) {
        verifierUniversite(getFrais(id), universiteId);
        return modifierFrais(id, data);
    }

    @Transactional
    public Frais changerStatutFrais(Long id, String statut, Long universiteId) {
        verifierUniversite(getFrais(id), universiteId);
        return changerStatut(id, Frais.StatutFrais.valueOf(statut.toUpperCase()));
    }

    public List<Frais> listerFrais(Long universiteId, String annee) {
        return listFrais(universiteId, annee, null);
    }

    @Transactional
    public int reaffecterFrais(Long fraisId, Long universiteId) {
        verifierUniversite(getFrais(fraisId), universiteId);
        return reaffecterFrais(fraisId);
    }

    public List<Frais> listFrais(Long universiteId, String annee, String statut) {
        List<Frais> result;
        if (annee != null && !annee.isEmpty()) {
            result = fraisRepo.findByUniversiteIdAndAnneeAcademique(universiteId, annee);
        } else {
            result = fraisRepo.findByUniversiteId(universiteId);
        }
        if (statut != null && !statut.isEmpty()) {
            result = result.stream()
                    .filter(f -> f.getStatut().name().equals(statut))
                    .collect(Collectors.toList());
        }
        return result;
    }

    // ─── Affectation automatique ──────────────────────────────────────

    @Transactional
    public void affecterFraisAuxEtudiants(Frais frais) {
        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(frais.getPromotionId());
        if (inscriptions.isEmpty()) {
            log.warn("Aucun étudiant trouvé pour la promotion {}", frais.getPromotionId());
            return;
        }

        List<AffectationFrais> affectations = inscriptions.stream()
                .map(ins -> AffectationFrais.builder()
                        .frais(frais)
                        .inscription(ins)
                        .montant(frais.getMontant())
                        .reste(frais.getMontant())
                        .dateEcheance(frais.getDateLimite())
                        .statut(StatutAffectation.EN_ATTENTE)
                        .build())
                .collect(Collectors.toList());

        affectationRepo.saveAll(affectations);
        log.info("{} affectations créées pour le frais {}", affectations.size(), frais.getCode());
    }

    @Transactional
    @CacheEvict(value = CacheNames.FRAIS, key = "#fraisId")
    public int reaffecterFrais(Long fraisId) {
        Frais frais = getFrais(fraisId);
        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(frais.getPromotionId());

        List<Long> idsExistants = affectationRepo.findByFraisId(fraisId).stream()
                .map(af -> af.getInscription().getId())
                .collect(Collectors.toList());

        int ajoutes = 0;
        for (Inscription ins : inscriptions) {
            if (!idsExistants.contains(ins.getId())) {
                AffectationFrais af = AffectationFrais.builder()
                        .frais(frais)
                        .inscription(ins)
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
        return ajoutes;
    }

    private void verifierUniversite(Frais frais, Long universiteId) {
        if (frais.getUniversite() == null || !frais.getUniversite().getId().equals(universiteId)) {
            throw new RuntimeException("Frais introuvable pour cette université");
        }
    }

    // ─── Affectation individuelle ──────────────────────────────────────

    @Transactional
    public AffectationFrais affecterFraisIndividuel(Long fraisId, Long inscriptionId) {
        Frais frais = getFrais(fraisId);
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        // Vérifier qu'il n'y a pas déjà une affectation active
        List<AffectationFrais> existantes = affectationRepo.findByFraisId(fraisId);
        for (AffectationFrais af : existantes) {
            if (af.getInscription().getId().equals(inscriptionId) && af.getStatut() != StatutAffectation.ANNULE) {
                throw new RuntimeException("Ce frais est déjà affecté à cet étudiant");
            }
        }

        AffectationFrais af = AffectationFrais.builder()
                .frais(frais)
                .inscription(inscription)
                .montant(frais.getMontant())
                .reste(frais.getMontant())
                .dateEcheance(frais.getDateLimite())
                .statut(StatutAffectation.EN_ATTENTE)
                .build();

        return affectationRepo.save(af);
    }

    // ─── Statistiques ──────────────────────────────────────────────────

    public Map<String, Object> getStatistiques(Long universiteId, String annee) {
        List<Frais> frais = fraisRepo.findByUniversiteIdAndAnneeAcademique(universiteId, annee);
        long totalFrais = frais.size();
        long actifs = frais.stream().filter(f -> f.getStatut() == Frais.StatutFrais.ACTIF).count();
        double montantTotal = frais.stream().mapToDouble(Frais::getMontant).sum();

        List<AffectationFrais> affectations = affectationRepo.findDettesActivesByUniversite(universiteId);
        long totalAffectations = affectations.size();
        double totalDettes = affectations.stream().mapToDouble(AffectationFrais::getReste).sum();

        return Map.of(
                "totalFrais", totalFrais,
                "actifs", actifs,
                "montantTotal", montantTotal,
                "totalAffectations", totalAffectations,
                "totalDettes", totalDettes,
                "annee", annee
        );
    }
}