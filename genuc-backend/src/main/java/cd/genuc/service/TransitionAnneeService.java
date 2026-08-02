package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import cd.genuc.model.Deliberation.DecisionJury;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransitionAnneeService {

    private final InscriptionRepository inscriptionRepository;
    private final DeliberationRepository deliberationRepository;
    private final AnneeAcademiqueRepository anneeRepository;
    private final PromotionRepository promotionRepository;
    private final InscriptionService inscriptionService;
    private final BaremePaiementRepository baremeRepository;

    /**
     * Exécute le passage à l'année suivante pour tous les étudiants d'une université donnée.
     * @param universiteId l'ID de l'université (ou null pour toutes)
     * @param anneeActuelle libellé de l'année qui se termine (ex: "2024-2025")
     * @param anneeSuivante libellé de la nouvelle année (ex: "2025-2026")
     * @param coefficientIndexation (ex: 1.05 pour +5% sur les frais)
     * @return résumé des opérations
     */
    @Transactional
    public Map<String, Object> executerPassageClasse(Long universiteId, String anneeActuelle, 
                                                     String anneeSuivante, double coefficientIndexation) {
        // Récupérer les années académiques
        AnneeAcademique anneeCourante = anneeRepository.findByLibelle(anneeActuelle)
                .orElseThrow(() -> new RuntimeException("Année actuelle introuvable"));
        AnneeAcademique nouvelleAnnee = anneeRepository.findByLibelle(anneeSuivante)
                .orElseGet(() -> anneeRepository.save(new AnneeAcademique(anneeSuivante, true)));

        // Récupérer les inscriptions de l'année courante (validées)
        List<Inscription> inscriptions;
        if (universiteId != null) {
            inscriptions = inscriptionRepository.findByUniversiteIdAndAnneeAcademiqueId(universiteId, anneeCourante.getId());
        } else {
            inscriptions = inscriptionRepository.findByAnneeAcademiqueId(anneeCourante.getId());
        }

        int reinscrits = 0;
        int diplomes = 0;
        int redoublants = 0;
        int erreurs = 0;
        int bloquesPromotionManquante = 0;
        java.util.Set<String> promotionsManquantes = new java.util.TreeSet<>();

        for (Inscription ins : inscriptions) {
            try {
                // Récupérer la délibération de l'étudiant pour cette année
                Deliberation delib = deliberationRepository.findByInscriptionIdAndAnneeAcademique(ins.getId(), anneeActuelle)
                        .orElse(null);
                if (delib == null) {
                    log.warn("Pas de délibération pour l'inscription {}", ins.getId());
                    continue;
                }

                DecisionJury decision = delib.getDecision();
                Promotion promotionActuelle = ins.getPromotion();
                Promotion nouvellePromotion = null;

                // Déterminer la nouvelle promotion
                if (decision == DecisionJury.ADMIS) {
                    // Passer à la promotion supérieure si elle existe
                    String niveauSuivant = promotionActuelle.getNiveauSuivant();
                    if (niveauSuivant != null) {
                        nouvellePromotion = promotionRepository.findByFiliereIdAndLibelle(
                                promotionActuelle.getFiliere().getId(), niveauSuivant);
                    }
                    if (nouvellePromotion != null) {
                        inscriptionService.reinscrire(ins.getId(), nouvelleAnnee, nouvellePromotion, false);
                        reinscrits++;
                    } else if (niveauSuivant == null) {
                        // Fin de cycle (G3, D3, dernier niveau connu...) = diplômé
                        diplomes++;
                    } else {
                        // Le niveau suivant est connu (ex : L2) mais la promotion
                        // n'existe pas dans la filière : ne PAS compter diplômé,
                        // signaler la promotion à créer.
                        promotionsManquantes.add(promotionActuelle.getFiliere().getNom()
                                + " -> " + niveauSuivant);
                        bloquesPromotionManquante++;
                    }
                } else if (decision == DecisionJury.REDOUBLE) {
                    // Redouble : même promotion
                    inscriptionService.reinscrire(ins.getId(), nouvelleAnnee, promotionActuelle, true);
                    redoublants++;
                } else if (decision == DecisionJury.DIPLOME) {
                    diplomes++;
                }
                // Les autres décisions (EXCLU, etc.) ne donnent pas lieu à réinscription

            } catch (Exception e) {
                log.error("Erreur pour l'inscription {} : {}", ins.getId(), e.getMessage());
                erreurs++;
            }
        }

        // Dupliquer les barèmes de paiement pour la nouvelle année
        dupliquerBaremes(universiteId, anneeActuelle, anneeSuivante, coefficientIndexation);

        return Map.of(
                "anneeActuelle", anneeActuelle,
                "anneeSuivante", anneeSuivante,
                "reinscrits", reinscrits,
                "diplomes", diplomes,
                "bloquesPromotionManquante", bloquesPromotionManquante,
                "promotionsManquantes", new java.util.ArrayList<>(promotionsManquantes),
                "redoublants", redoublants,
                "erreurs", erreurs
        );
    }

    private void dupliquerBaremes(Long universiteId, String anneeActuelle, String anneeSuivante, double coeff) {
        List<BaremePaiement> baremes;
        if (universiteId != null) {
            baremes = baremeRepository.findByUniversiteIdAndAnneeAcademique(universiteId, anneeActuelle);
        } else {
            baremes = baremeRepository.findByAnneeAcademique(anneeActuelle);
        }

        for (BaremePaiement b : baremes) {
            BaremePaiement nouveau = BaremePaiement.builder()
                    .anneeAcademique(anneeSuivante)
                    .niveau(b.getNiveau())
                    .typePaiement(b.getTypePaiement())
                    .montantAttendu(b.getMontantAttendu() * coeff)
                    .devise(b.getDevise())
                    .departementId(b.getDepartementId())
                    .universite(b.getUniversite())
                    .actif(true)
                    .build();
            baremeRepository.save(nouveau);
        }
        log.info("Barèmes dupliqués pour l'année {} avec coefficient {}", anneeSuivante, coeff);
    }
}