package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.Deliberation.StatutDeliberation;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import cd.genuc.model.Deliberation.DecisionJury;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
    private final UniversiteRepository universiteRepository;

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
        return executerPassageClasse(universiteId, anneeActuelle, anneeSuivante, coefficientIndexation, false);
    }

    @Transactional
    public Map<String, Object> executerPassageClasse(Long universiteId, String anneeActuelle, 
                                                     String anneeSuivante, double coefficientIndexation, boolean dryRun) {
        // Années académiques recherchées PAR ÉTABLISSEMENT.
        //
        // L'unicité porte sur (libelle, universite_id) : « 2025-2026 » existe une
        // fois par établissement. Chercher sur le seul libellé renvoyait donc
        // plusieurs lignes dès qu'un deuxième établissement ouvrait la même année
        // — cas normal d'une plateforme nationale — et l'appel, typé pour un
        // resultat unique, levait une exception. De plus l'année créée ici l'était
        // sans université, en violation d'une contrainte NOT NULL.
        // L'établissement est OBLIGATOIRE. Un passage « toutes universités » ne
        // veut rien dire ici : années académiques ET promotions appartiennent
        // chacune à un établissement, il en existe autant de « 2025-2026 » et de
        // « G2 » que d'établissements raccordés. Le traitement global tel qu'il
        // était écrit échouait donc dès le deuxième. Une campagne nationale se
        // conduit établissement par établissement.
        if (universiteId == null) {
            throw new RuntimeException(
                    "L'établissement est obligatoire : le passage de classe se conduit établissement par établissement.");
        }
        Universite universite = universiteRepository.findById(universiteId).orElseThrow(
                () -> new RuntimeException("Établissement introuvable : " + universiteId));

        AnneeAcademique anneeCourante = trouverAnnee(anneeActuelle, universite)
                .orElseThrow(() -> new RuntimeException("Année actuelle introuvable"));
        AnneeAcademique nouvelleAnnee = trouverAnnee(anneeSuivante, universite)
                .orElseGet(() -> {
                    AnneeAcademique creee = new AnneeAcademique(anneeSuivante, true, universite);
                    return dryRun ? creee : anneeRepository.save(creee);
                });

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
        // Détail borné : un passage de classe porte sur toutes les inscriptions
        // validées d'un établissement. Si la campagne est lancée avant que les
        // délibérations ne soient publiées, CHAQUE inscription produit une ligne
        // — la réponse HTTP enflerait à la taille de l'effectif. Le compteur
        // « erreurs » reste exact ; seul l'échantillon affiché est plafonné.
        final int MAX_DETAILS = 100;
        java.util.List<String> erreursDetails = new java.util.ArrayList<>();
        java.util.function.Consumer<String> noter = message -> {
            if (erreursDetails.size() < MAX_DETAILS) {
                erreursDetails.add(message);
            }
        };

        for (Inscription ins : inscriptions) {
            try {
                // Récupérer la délibération PUBLIÉE de l'étudiant pour cette année
                Deliberation delib = deliberationRepository.findByInscriptionIdAndAnneeAcademique(ins.getId(), anneeActuelle)
                        .orElse(null);
                if (delib == null) {
                    log.warn("Pas de délibération pour l'inscription {}", ins.getId());
                    noter.accept("Inscription " + ins.getId() + " : pas de délibération");
                    erreurs++;
                    continue;
                }

                if (delib.getStatut() != StatutDeliberation.PUBLIEE) {
                    log.warn("Délibération non publiée pour inscription {} (statut: {})", ins.getId(), delib.getStatut());
                    noter.accept("Inscription " + ins.getId() + " : délibération non publiée (statut: " + delib.getStatut() + ")");
                    erreurs++;
                    continue;
                }

                DecisionJury decision = delib.getDecision();
                Promotion promotionActuelle = ins.getPromotion();
                Promotion nouvellePromotion = null;

                if (decision == DecisionJury.ADMIS) {
                    String niveauSuivant = promotionActuelle.getNiveauSuivant();
                    if (niveauSuivant != null) {
                        nouvellePromotion = trouverPromotion(
                                promotionActuelle.getFiliere().getId(), niveauSuivant, nouvelleAnnee);
                    }
                    if (nouvellePromotion != null) {
                        if (!dryRun) {
                            inscriptionService.reinscrire(ins.getId(), nouvelleAnnee, nouvellePromotion, false);
                        }
                        reinscrits++;
                    } else if (niveauSuivant == null) {
                        diplomes++;
                    } else {
                        promotionsManquantes.add(promotionActuelle.getFiliere().getNom()
                                + " -> " + niveauSuivant);
                        bloquesPromotionManquante++;
                    }
                } else if (decision == DecisionJury.REDOUBLE) {
                    if (!dryRun) {
                        inscriptionService.reinscrire(ins.getId(), nouvelleAnnee, promotionActuelle, true);
                    }
                    redoublants++;
                } else if (decision == DecisionJury.DIPLOME) {
                    diplomes++;
                }

            } catch (Exception e) {
                log.error("Erreur pour l'inscription {} : {}", ins.getId(), e.getMessage());
                noter.accept("Inscription " + ins.getId() + " : " + e.getMessage());
                erreurs++;
            }
        }

        // Dupliquer les barèmes de paiement pour la nouvelle année (sauf en dry-run)
        if (!dryRun) {
            dupliquerBaremes(universiteId, anneeActuelle, anneeSuivante, coefficientIndexation);
        }

        return Map.of(
                "dryRun", dryRun,
                "anneeActuelle", anneeActuelle,
                "anneeSuivante", anneeSuivante,
                "reinscrits", reinscrits,
                "diplomes", diplomes,
                "redoublants", redoublants,
                "bloquesPromotionManquante", bloquesPromotionManquante,
                "promotionsManquantes", new java.util.ArrayList<>(promotionsManquantes),
                "erreurs", erreurs,
                "erreursDetails", erreursDetails
        );
    }

    /** Année académique de CET établissement. */
    private java.util.Optional<AnneeAcademique> trouverAnnee(String libelle, Universite universite) {
        return anneeRepository.findByLibelleAndUniversite(libelle, universite);
    }

    /**
     * Promotion d'accueil pour un niveau donné.
     *
     * <p>On vise d'abord celle de l'année d'arrivée, réponse juste quand
     * l'établissement crée ses promotions année par année. À défaut — cas des
     * établissements qui les réutilisent — on retient la plus récente.</p>
     *
     * <p>Ce détour remplace un {@code findByFiliereIdAndLibelle} à résultat
     * unique : le couple (filière, libellé) n'est pas unique, une ligne existant
     * par année ouverte. L'appel direct levait donc une exception dès la
     * deuxième année d'exploitation — et comme la boucle attrape les erreurs
     * étudiant par étudiant, la promotion entière restait silencieusement
     * bloquée au lieu d'échouer bruyamment.</p>
     */
    private Promotion trouverPromotion(Long filiereId, String libelle, AnneeAcademique anneeCible) {
        if (anneeCible != null && anneeCible.getId() != null) {
            Promotion ciblee = promotionRepository
                    .findByFiliereIdAndLibelleAndAnneeAcademiqueId(filiereId, libelle, anneeCible.getId())
                    .orElse(null);
            if (ciblee != null) {
                return ciblee;
            }
        }
        return promotionRepository
                .findFirstByFiliereIdAndLibelleOrderByAnneeAcademiqueIdDesc(filiereId, libelle)
                .orElse(null);
    }

    private void dupliquerBaremes(Long universiteId, String anneeActuelle, String anneeSuivante, double coeff) {
        List<BaremePaiement> baremes;
        if (universiteId != null) {
            baremes = baremeRepository.findByUniversiteIdAndAnneeAcademique(universiteId, anneeActuelle);
        } else {
            baremes = baremeRepository.findByAnneeAcademique(anneeActuelle);
        }

        for (BaremePaiement b : baremes) {
            Optional<BaremePaiement> existant = baremeRepository
                    .findByUniversiteIdAndAnneeAcademiqueAndNiveauAndTypePaiement(
                            b.getUniversite().getId(), anneeSuivante, b.getNiveau(), b.getTypePaiement());
            if (existant.isPresent()) {
                continue;
            }

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