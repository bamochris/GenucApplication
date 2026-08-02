package cd.genuc.service.tachpay;

import cd.genuc.model.*;
import cd.genuc.config.cache.CacheNames;
import cd.genuc.model.StatutAffectation;
import cd.genuc.model.Paiement.StatutPaiement;
import cd.genuc.repository.*;
import cd.genuc.service.kafka.NotificationProducer;
import cd.genuc.util.PdfGenerateur;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TachPayPaiementService {

    private final AffectationFraisRepository affectationRepo;
    private final PaiementRepository paiementRepo;
    private final InscriptionRepository inscriptionRepo;
    private final BonDePaiementRepository bonRepo;
    private final TransactionExterneRepository transactionExterneRepo;
    private final PdfGenerateur pdfGenerateur;
    private final cd.genuc.service.CoordonneesBancairesService coordonneesBancairesService;
    private final NotificationProducer notificationProducer;
    private final StripeService stripeService;
    private final MobileMoneyService mobileMoneyService;
    private final CacheManager cacheManager;

    // ─── 1. Situation financière de l'étudiant ──────────────────────

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.SITUATION_FINANCIERE, key = "#inscriptionId")
    public Map<String, Object> getSituationFinanciere(Long inscriptionId) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        // On ne retient que les frais attribués par l'admin pour LA promotion
        // ET l'année académique de cette inscription (rien d'autre ne s'affiche).
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
                    d.put("fraisId", af.getFrais().getId());
                    d.put("fraisCode", af.getFrais().getCode());
                    d.put("fraisLibelle", af.getFrais().getLibelle());
                    d.put("montant", af.getMontant());
                    d.put("reste", af.getReste());
                    d.put("paye", af.getMontantPaye());
                    d.put("statut", af.getStatut().name());
                    d.put("dateEcheance", af.getDateEcheance());
                    d.put("estEnRetard", af.getDateEcheance() != null && af.getDateEcheance().isBefore(LocalDate.now()));
                    d.put("modesPaiementAutorises", new ArrayList<>(af.getFrais().getModesPaiementAutorises()));
                    d.put("banquesAutorisees", new ArrayList<>(af.getFrais().getBanquesAutorisees()));
                    return d;
                })
                .collect(Collectors.toList());

        List<Paiement> paiements = paiementRepo.findByInscriptionId(inscriptionId).stream()
                .filter(p -> p.getStatut() == StatutPaiement.VALIDE)
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

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.FRAIS_ETUDIANT, key = "#inscriptionId")
    public Map<String, Object> getFraisAPayer(Long inscriptionId) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));
        List<Map<String, Object>> frais = listerFraisAPayer(inscription);
        double montantTotal = frais.stream()
                .mapToDouble(f -> ((Number) f.get("reste")).doubleValue())
                .sum();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", frais.size());
        result.put("montantTotal", montantTotal);
        result.put("frais", frais);
        return result;
    }

    private List<Map<String, Object>> listerFraisAPayer(Inscription inscription) {
        List<AffectationFrais> dettes = affectationRepo.findDettesActivesByInscription(inscription.getId());
        return dettes.stream()
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
            // Canaux ouverts par l'admin sur ce frais. Listes vides = aucune
            // restriction ; le client fait l'intersection des frais sélectionnés.
            d.put("modesPaiementAutorises", new ArrayList<>(af.getFrais().getModesPaiementAutorises()));
            d.put("banquesAutorisees", new ArrayList<>(af.getFrais().getBanquesAutorisees()));
            return d;
        }).collect(Collectors.toList());
    }

    // ─── 2. Génération de bon de paiement ────────────────────────────

    /**
     * Émet un bon de caisse par banque de règlement.
     *
     * <p>L'admin désigne, sur chaque frais, la ou les banques où le règlement doit être
     * déposé. Deux frais dirigés vers des banques différentes ne peuvent pas figurer sur
     * le même bon : le montant « NET A PAYER » ne correspondrait alors à aucun versement
     * réel, et le guichetier encaisserait une somme qui ne le concerne pas.</p>
     *
     * <p>Les frais qui partagent au moins une banque restent regroupés — un frais ouvert
     * sur {Equity, UBA} et un frais ouvert sur {UBA} tiennent sur un seul bon, payable à
     * UBA. Le regroupement est glouton et suit l'ordre de sélection, donc reproductible.</p>
     *
     * @return un bon par groupe de frais partageant une banque (jamais vide en cas de succès)
     */
    @Transactional
    public List<BonDePaiement> genererBonsDePaiement(Long inscriptionId, List<Long> affectationIds) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        List<AffectationFrais> retenues = affectationRepo.findAllById(affectationIds).stream()
                .filter(af -> af.getInscription().getId().equals(inscriptionId))
                .filter(af -> af.getStatut() != StatutAffectation.PAYE
                           && af.getStatut() != StatutAffectation.ANNULE)
                .filter(af -> af.getReste() != null && af.getReste() > 0)
                .toList();

        if (retenues.isEmpty()) {
            throw new RuntimeException("Aucun montant à payer pour les affectations sélectionnées.");
        }

        Long universiteId = inscription.getUniversite() != null
                ? inscription.getUniversite().getId() : null;
        java.util.Set<Long> tousComptesActifs = comptesActifs(universiteId);

        List<BonDePaiement> bons = new java.util.ArrayList<>();
        for (GroupeBanque groupe : regrouperParBanqueCommune(retenues, tousComptesActifs)) {
            bons.add(emettreBon(inscription, groupe));
        }
        return bons;
    }

    /** Groupe de frais réglables au même guichet. */
    private record GroupeBanque(java.util.Set<Long> banques, double montant) {
    }

    /**
     * Partitionne les frais en groupes dont les banques autorisées s'intersectent.
     *
     * <p>Glouton : on ouvre un groupe avec le premier frais, puis on y ajoute chaque
     * frais suivant tant que l'intersection des banques reste non vide. Les frais
     * écartés repartent dans un tour suivant.</p>
     */
    private List<GroupeBanque> regrouperParBanqueCommune(List<AffectationFrais> affectations,
                                                         java.util.Set<Long> tousComptesActifs) {
        List<AffectationFrais> restantes = new java.util.ArrayList<>(affectations);
        List<GroupeBanque> groupes = new java.util.ArrayList<>();

        while (!restantes.isEmpty()) {
            AffectationFrais premiere = restantes.remove(0);
            java.util.Set<Long> commun = new java.util.LinkedHashSet<>(
                    banquesDe(premiere, tousComptesActifs));
            double montant = premiere.getReste();

            java.util.Iterator<AffectationFrais> it = restantes.iterator();
            while (it.hasNext()) {
                AffectationFrais candidate = it.next();
                java.util.Set<Long> intersection = new java.util.LinkedHashSet<>(commun);
                intersection.retainAll(banquesDe(candidate, tousComptesActifs));
                if (!intersection.isEmpty()) {
                    commun = intersection;
                    montant += candidate.getReste();
                    it.remove();
                }
            }
            groupes.add(new GroupeBanque(commun, Math.round(montant * 100.0) / 100.0));
        }
        return groupes;
    }

    /** Banques ouvertes pour un frais ; à défaut de restriction, tous les comptes actifs. */
    private java.util.Set<Long> banquesDe(AffectationFrais affectation,
                                          java.util.Set<Long> tousComptesActifs) {
        java.util.Set<Long> autorisees = affectation.getFrais() != null
                ? affectation.getFrais().getBanquesAutorisees() : null;
        return (autorisees == null || autorisees.isEmpty()) ? tousComptesActifs : autorisees;
    }

    private java.util.Set<Long> comptesActifs(Long universiteId) {
        return coordonneesBancairesService.identifiantsComptesActifs(universiteId);
    }

    /**
     * Banque(s) de règlement d'un bon, mises en forme pour l'affichage.
     *
     * <p>NB : l'ancienne variante {@code genererBonDePaiement} (singulier), qui
     * renvoyait {@code genererBonsDePaiement(...).get(0)}, a été supprimée. Son
     * unique appelant — le guichet caisse — perdait silencieusement les bons des
     * autres banques ; toute émission passe désormais par la liste complète.</p>
     */
    @Transactional(readOnly = true)
    public List<Map<String, String>> banquesDuBon(BonDePaiement bon) {
        Inscription inscription = bon.getInscription();
        Long universiteId = inscription != null && inscription.getUniversite() != null
                ? inscription.getUniversite().getId() : null;
        return coordonneesBancairesService.pourAffichage(universiteId, bon.getBanquesAutorisees());
    }

    /** Crée, persiste et notifie un bon pour un groupe de frais réglables au même guichet. */
    private BonDePaiement emettreBon(Inscription inscription, GroupeBanque groupe) {
        // Plafond volontairement évalué à chaque émission : un regroupement sur
        // plusieurs banques produit plusieurs bons, qui comptent tous dans le quota.
        long bonsActifs = bonRepo.findByInscriptionIdAndUtiliseFalse(inscription.getId()).size();
        if (bonsActifs >= 3) {
            throw new RuntimeException("Vous avez déjà 3 bons actifs. Utilisez-les avant d'en générer un nouveau.");
        }

        BonDePaiement bon = BonDePaiement.builder()
                .inscription(inscription)
                .montant(groupe.montant())
                .dateEmission(LocalDate.now())
                .dateExpiration(LocalDate.now().plusDays(7))
                .utilise(false)
                .observations("Bon généré depuis le portail étudiant")
                // Banque(s) de règlement figées ici : le PDF est régénéré plus tard
                // depuis le seul numéro, la configuration des frais aura pu changer.
                .banquesAutorisees(new java.util.LinkedHashSet<>(groupe.banques()))
                .build();

        // Générer le QR code (contenu = numéro du bon)
        String qrContent = "GENUC:BP:" + bon.getNumero();
        try {
            // 300 px comme BonDePaiementService : le ticket thermique imprime à 203 dpi,
            // et 150 px étalés sur les 38 mm du QR donnaient des modules baveux, pénibles
            // à lire à la douchette.
            byte[] qrBytes = pdfGenerateur.genererQrCode(qrContent, 300);
            // Base64 NU, sans préfixe data URI : c'est le contrat du champ (cf.
            // BonDePaiement.codeQR) et tous ses lecteurs — le PDF comme le portail
            // admin — ajoutent eux-mêmes « data:image/png;base64, ». Enregistrer le
            // préfixe ici le faisait apparaître EN DOUBLE à l'impression, le décodage
            // échouait et les bons sortaient sans QR code.
            bon.setCodeQR(Base64.getEncoder().encodeToString(qrBytes));
        } catch (Exception e) {
            log.warn("Impossible de générer le QR code : {}", e.getMessage());
            // null et non une sentinelle textuelle : « QR non disponible » se retrouvait
            // dans un <img src> côté admin (image cassée) et dans le décodeur du PDF.
            bon.setCodeQR(null);
        }

        BonDePaiement saved = bonRepo.save(bon);

        notifierBonApresCommit(saved, inscription);

        return saved;
    }

    /**
     * Demande la génération PDF + l'envoi email/SMS APRÈS le commit, sans jamais
     * pouvoir faire échouer l'émission du bon.
     *
     * <p>L'appel direct dans la transaction couplait l'existence du bon à la
     * disponibilité du courtier : Kafka arrêté → {@code KafkaException("Send
     * failed")} remontée jusqu'au contrôleur → rollback → l'étudiant comme le
     * caissier recevaient « Send failed » et AUCUN bon n'était jamais persisté
     * (constaté en dev, table {@code bons_paiement} vide). Or le bon est la pièce
     * opposable présentée au guichet ; le mail n'est qu'une commodité, et il ne
     * doit pas non plus partir pour un bon dont la transaction serait annulée —
     * d'où l'envoi après commit.</p>
     */
    private void notifierBonApresCommit(BonDePaiement bon, Inscription inscription) {
        Runnable envoi = () -> {
            try {
                notificationProducer.demanderBonPaiementPdf(
                    bon.getNumero(), inscription.getEmail(), inscription.getTelephone());
            } catch (Exception e) {
                log.error("Notification du bon {} impossible — le bon reste émis et valide : {}",
                          bon.getNumero(), e.getMessage());
            }
        };

        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        envoi.run();
                    }
                });
        } else {
            envoi.run();
        }
    }

    public byte[] genererPdfBon(String numero) throws Exception {
        BonDePaiement bon = bonRepo.findByNumero(numero)
                .orElseThrow(() -> new RuntimeException("Bon de paiement introuvable"));
        return genererPdfBon(bon, bon.getInscription());
    }

    public byte[] genererPdfBon(BonDePaiement bon, Inscription inscription) throws Exception {
        // Utiliser PdfGenerateur pour créer un PDF du bon
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("numero", bon.getNumero());
        data.put("montant", bon.getMontant());
        data.put("devise", "USD");
        data.put("dateEmission", bon.getDateEmission().toString());
        data.put("dateExpiration", bon.getDateExpiration().toString());
        data.put("etudiant", inscription.getPrenom() + " " + inscription.getNom());
        data.put("matricule", inscription.getMatricule());
        data.put("universite", inscription.getUniversite().getNom());
        data.put("departement", inscription.getDepartement() != null
                ? inscription.getDepartement().getNom() : null);
        data.put("filiere", inscription.getFiliere() != null ? inscription.getFiliere().getNom() : null);
        data.put("niveau", inscription.getNiveau());
        data.put("anneeAcademique", inscription.getAnneeAcademique() != null
                ? inscription.getAnneeAcademique().getLibelle() : null);
        data.put("promotion", inscription.getPromotion() != null
                ? inscription.getPromotion().getLibelle() : null);
        data.put("faculte", inscription.getDepartement() != null
                && inscription.getDepartement().getFaculte() != null
                ? inscription.getDepartement().getFaculte().getNom() : null);
        // Le QR est stocké en base64 nu ; PdfGenerateur accepte désormais les deux formes,
        // mais on préfixe explicitement pour rester homogène avec BonDePaiementService.
        data.put("qrCode", bon.getCodeQR() != null ? "data:image/png;base64," + bon.getCodeQR() : null);
        // Banque(s) de règlement FIGÉES sur le bon à son émission : c'est le guichet
        // désigné par l'admin, pas un recalcul depuis la configuration courante des
        // frais (qui a pu changer depuis que l'étudiant a le bon en main).
        data.put("banques", coordonneesBancairesService.pourAffichage(
                inscription.getUniversite() != null ? inscription.getUniversite().getId() : null,
                bon.getBanquesAutorisees()));

        return pdfGenerateur.genererBonPaiement(data);
    }

    // ─── 3. Validation d'un bon en caisse ────────────────────────────

    @Transactional
    // Éviction ciblée sur l'inscription concernée plutôt que globale : un encaissement en
    // caisse ne doit pas vider la situation financière de tous les étudiants de toutes les
    // universités. La clé n'étant connue qu'après lecture du bon, l'éviction est faite dans
    // le corps de la méthode via evincerCachesFinanciers(...), après le commit.
    @CacheEvict(value = CacheNames.STATUT_PAIEMENT, allEntries = true)
    public Paiement validerBonDePaiement(String numeroBon, Long caissierId) {
        BonDePaiement bon = bonRepo.findByNumero(numeroBon)
                .orElseThrow(() -> new RuntimeException("Bon de paiement invalide"));

        if (!bon.estUtilisable()) {
            if (bon.isUtilise()) {
                throw new RuntimeException("Ce bon a déjà été utilisé");
            }
            if (bon.estExpire()) {
                throw new RuntimeException("Ce bon a expiré");
            }
        }

        Inscription inscription = bon.getInscription();

        // Récupérer les affectations en attente pour cette inscription
        List<AffectationFrais> affectations = affectationRepo.findDettesActivesByInscription(inscription.getId());

        // Créer le paiement
        Paiement paiement = Paiement.builder()
                .reference(genererReference())
                .montant(bon.getMontant())
                .devise("USD")
                .modePaiement(Paiement.ModePaiement.ESPECES)
                .statut(StatutPaiement.VALIDE)
                .type(Paiement.TypePaiement.FRAIS_ACADEMIQUES)
                .datePaiement(LocalDate.now())
                .dateValidation(LocalDate.now())
                .agentId(caissierId)
                .inscription(inscription)
                .universite(inscription.getUniversite())
                .notesCaisse("Paiement par bon n°" + numeroBon)
                .build();

        paiement = paiementRepo.save(paiement);

        // Marquer le bon comme utilisé
        bon.setUtilise(true);
        bonRepo.save(bon);

        // Appliquer le paiement aux affectations
        double resteAPayer = bon.getMontant();
        for (AffectationFrais af : affectations) {
            if (resteAPayer <= 0) break;
            double montantAffecte = Math.min(af.getReste(), resteAPayer);
            af.appliquerPaiement(montantAffecte);
            affectationRepo.save(af);
            resteAPayer -= montantAffecte;
        }

        // Le solde de CET étudiant vient de changer : on ne purge que ses deux entrées.
        evincerCachesFinanciers(inscription.getId());

        // Envoyer un reçu par email
        try {
            envoyerRecuPaiement(paiement);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du reçu : {}", e.getMessage());
        }

        return paiement;
    }

    /**
     * Évince la situation financière et les frais à payer d'une inscription précise.
     *
     * <p>Remplace un {@code @CacheEvict(allEntries = true)} qui vidait, à chaque encaissement
     * en caisse, la situation financière de <b>tous</b> les étudiants de toutes les
     * universités : sur un guichet actif, le cache n'avait jamais le temps de se remplir et
     * chaque consultation repartait en base.</p>
     *
     * <p>L'éviction est appliquée après le commit : les caches sont enveloppés dans un
     * {@code TransactionAwareCacheDecorator}, une transaction annulée ne purge donc rien.</p>
     */
    private void evincerCachesFinanciers(Long inscriptionId) {
        if (inscriptionId == null) {
            return;
        }
        evincer(CacheNames.SITUATION_FINANCIERE, inscriptionId);
        evincer(CacheNames.FRAIS_ETUDIANT, inscriptionId);
    }

    private void evincer(String nomCache, Object cle) {
        Cache cache = cacheManager.getCache(nomCache);
        if (cache != null) {
            cache.evict(cle);
        }
    }

    public Map<String, Object> getHistoriquePaiements(Long inscriptionId, int page, int size) {
        Page<Paiement> pageResult = paiementRepo.findByInscriptionId(
                inscriptionId, PageRequest.of(page, size));

        List<Map<String, Object>> paiements = pageResult.getContent().stream()
                .map(this::toPaiementMap)
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", page);
        result.put("size", size);
        result.put("totalElements", pageResult.getTotalElements());
        result.put("totalPages", pageResult.getTotalPages());
        result.put("paiements", paiements);
        return result;
    }

    public List<Map<String, Object>> getHistoriquePaiements(Long inscriptionId) {
        return paiementRepo.findByInscriptionId(inscriptionId).stream()
                .map(this::toPaiementMap)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> initierPaiementCarte(Long inscriptionId, List<Long> affectationIds,
                                                    String successUrl, String cancelUrl) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        double montant = calculerMontantAffectations(inscriptionId, affectationIds);
        if (montant <= 0) {
            throw new RuntimeException("Aucun montant à payer pour les affectations sélectionnées");
        }

        Paiement paiement = creerPaiementEnAttente(inscription, montant, Paiement.ModePaiement.CARTE_BANCAIRE, null);
        StripeService.StripeSession session = stripeService.creerSessionCheckout(
                montant, "USD", successUrl, cancelUrl, "Paiement frais académiques");

        transactionExterneRepo.save(TransactionExterne.builder()
                .paiement(paiement)
                .provider("STRIPE")
                .externalId(session.id())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("paiementId", paiement.getId());
        result.put("reference", paiement.getReference());
        result.put("montant", montant);
        result.put("sessionId", session.id());
        // URL hébergée Stripe : c'est ici que la carte est réellement saisie
        result.put("checkoutUrl", session.url());
        return result;
    }

    @Transactional
    public Map<String, Object> initierPaiementMobileMoney(Long inscriptionId, List<Long> affectationIds,
                                                         String telephone, String operateur) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        double montant = calculerMontantAffectations(inscriptionId, affectationIds);
        if (montant <= 0) {
            throw new RuntimeException("Aucun montant à payer pour les affectations sélectionnées");
        }

        Paiement paiement = creerPaiementEnAttente(
                inscription, montant, Paiement.ModePaiement.MOBILE_MONEY, operateur);

        TransactionExterne tx = mobileMoneyService.initierPaiement(
                paiement.getId(), operateur, telephone, paiement.getReference());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("paiementId", paiement.getId());
        result.put("reference", paiement.getReference());
        result.put("montant", montant);
        result.put("operateur", operateur);
        result.put("externalId", tx.getExternalId());
        result.put("status", tx.getStatus());
        result.put("message", "Paiement initié. Confirmez sur votre téléphone.");
        return result;
    }

    private Map<String, Object> toPaiementMap(Paiement p) {
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
    }

    private double calculerMontantAffectations(Long inscriptionId, List<Long> affectationIds) {
        return affectationRepo.findAllById(affectationIds).stream()
                .filter(af -> af.getInscription().getId().equals(inscriptionId))
                .filter(af -> af.getStatut() != StatutAffectation.PAYE && af.getStatut() != StatutAffectation.ANNULE)
                .mapToDouble(AffectationFrais::getReste)
                .sum();
    }

    private Paiement creerPaiementEnAttente(Inscription inscription, double montant,
                                            Paiement.ModePaiement mode, String operateur) {
        Paiement paiement = Paiement.builder()
                .montant(Math.round(montant * 100.0) / 100.0)
                .devise("USD")
                .modePaiement(mode)
                .statut(StatutPaiement.EN_ATTENTE)
                .type(Paiement.TypePaiement.FRAIS_ACADEMIQUES)
                .datePaiement(LocalDate.now())
                .operateur(operateur)
                .inscription(inscription)
                .universite(inscription.getUniversite())
                .build();
        return paiementRepo.save(paiement);
    }

    // ─── 5. Envoi de reçu ─────────────────────────────────────────────

    private void envoyerRecuPaiement(Paiement paiement) {
        Inscription inscription = paiement.getInscription();
        // Génération PDF déléguée au PdfGenerationConsumer — ne bloque pas le thread HTTP
        notificationProducer.demanderRecuPaiementPdf(
            paiement.getReference(),
            inscription.getEmail()
        );
    }

    // ─── 6. Statut d'un paiement (polling frontend) ───────────────────

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.STATUT_PAIEMENT, key = "#reference")
    public Map<String, Object> getStatutPaiement(String reference) {
        Paiement paiement = paiementRepo.findByReference(reference)
            .orElseThrow(() -> new RuntimeException("Paiement introuvable : " + reference));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reference", reference);
        result.put("statut", paiement.getStatut().name());
        result.put("montant", paiement.getMontant());
        result.put("devise", paiement.getDevise() != null ? paiement.getDevise() : "USD");
        result.put("operateur", paiement.getOperateur());
        result.put("modePaiement", paiement.getModePaiement().name());
        result.put("dateValidation", paiement.getDateValidation());
        result.put("motifRejet", paiement.getMotifRejet());
        return result;
    }

    // ─── 7. Rapport TachPay du jour (caissier) ────────────────────────

    public Map<String, Object> getRapportTachPayJournalier(Long universiteId) {
        LocalDate today = LocalDate.now();
        List<Paiement> tous = paiementRepo.paiementsDuJour(universiteId, today);

        double totalValide = tous.stream()
            .filter(p -> p.getStatut() == Paiement.StatutPaiement.VALIDE)
            .mapToDouble(Paiement::getMontant).sum();

        long nbMobile = tous.stream()
            .filter(p -> p.getModePaiement() == Paiement.ModePaiement.MOBILE_MONEY).count();
        long nbEspeces = tous.stream()
            .filter(p -> p.getModePaiement() == Paiement.ModePaiement.ESPECES).count();
        long nbCarte = tous.stream()
            .filter(p -> p.getModePaiement() == Paiement.ModePaiement.CARTE_BANCAIRE).count();
        // Le dépôt d'espèces en banque est compté avec les virements : les deux
        // arrivent sur le compte bancaire de l'établissement et se rapprochent
        // depuis le même relevé. Sans cela, ce canal disparaîtrait des statistiques.
        long nbVirement = tous.stream()
            .filter(p -> p.getModePaiement() == Paiement.ModePaiement.VIREMENT
                      || p.getModePaiement() == Paiement.ModePaiement.DEPOT_BANCAIRE).count();
        long nbEnAttente = tous.stream()
            .filter(p -> p.getStatut() == Paiement.StatutPaiement.EN_ATTENTE).count();

        List<Map<String, Object>> details = tous.stream().map(p -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("reference", p.getReference());
            d.put("montant", p.getMontant());
            d.put("modePaiement", p.getModePaiement().name());
            d.put("statut", p.getStatut().name());
            d.put("operateur", p.getOperateur());
            if (p.getInscription() != null) {
                d.put("etudiant", p.getInscription().getPrenom() + " " + p.getInscription().getNom());
                d.put("matricule", p.getInscription().getMatricule());
            }
            return d;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date", today.toString());
        result.put("totalValide", totalValide);
        result.put("nbTotal", tous.size());
        result.put("nbEnAttente", nbEnAttente);
        result.put("repartition", Map.of(
            "MOBILE_MONEY", nbMobile,
            "ESPECES", nbEspeces,
            "CARTE_BANCAIRE", nbCarte,
            "VIREMENT", nbVirement
        ));
        result.put("paiements", details);
        return result;
    }

    // ─── Utilitaires ──────────────────────────────────────────────────

    /**
     * Un frais ne doit apparaître dans le portail étudiant que si l'admin l'a
     * attribué pour LA promotion ET L'année académique de l'inscription courante.
     * Tout autre frais (attribué individuellement à une autre promotion/année,
     * reliquat migré, etc.) est masqué du portail et des totaux TachPay.
     */
    private boolean estAttribuePourPromotionEtAnnee(AffectationFrais af, Inscription inscription) {
        Frais frais = af.getFrais();
        if (frais == null || inscription == null) {
            return false;
        }

        // 1. Même promotion (dans le modèle, une promotion est déjà datée : elle
        //    appartient à une seule année académique).
        Long promotionInscription = inscription.getPromotion() != null
                ? inscription.getPromotion().getId() : null;
        if (frais.getPromotionId() == null
                || !frais.getPromotionId().equals(promotionInscription)) {
            return false;
        }

        // 2. Même année académique. Comparaison normalisée (chiffres uniquement)
        //    pour tolérer les écarts de format ("2026-2027" vs "2026 - 2027").
        //    Si l'un des deux libellés est absent, la promotion (déjà datée) fait foi.
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

    private String genererReference() {
        int annee = LocalDate.now().getYear();
        long seq = paiementRepo.countParAnnee(annee) + 1;
        return String.format("TCH-%d-%05d", annee, seq);
    }
}