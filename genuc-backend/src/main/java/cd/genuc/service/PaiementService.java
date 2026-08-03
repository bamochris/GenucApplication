package cd.genuc.service;

import cd.genuc.exception.*;
import cd.genuc.model.*;
import cd.genuc.model.Paiement.ModePaiement;
import cd.genuc.model.Paiement.StatutPaiement;
import cd.genuc.model.Paiement.TypePaiement;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service de gestion des paiements GENUC (FRANÇAIS)
 * ✅ Harmonisé pour la validation d'inscriptions, le calcul de solde et l'analyse financière
 */
@Service
@RequiredArgsConstructor
public class PaiementService {

    private final PaiementRepository paiementRepo;
    private final InscriptionRepository inscriptionRepo;
    private final UniversiteRepository universiteRepo;
    private final BaremePaiementRepository baremeRepo;
    private final DossierInscriptionRepository dossierRepo;
    private final AffectationFraisRepository affectationRepo;

    // ══════════════════════════════════════════
    // ENREGISTRER UN PAIEMENT
    // ══════════════════════════════════════════

    /**
     * Soumet un nouveau paiement (étudiant ou agent de caisse)
     */
    @Transactional
    public Paiement soumettre(Map<String, Object> data) {
        Long inscriptionId = Long.valueOf(data.get("inscriptionId").toString());
        Long universiteId  = Long.valueOf(data.get("universiteId").toString());

        Inscription inscription = inscriptionRepo.findById(inscriptionId)
            .orElseThrow(() -> new InscriptionNotFoundException(inscriptionId));

        Universite universite = universiteRepo.findById(universiteId)
            .orElseThrow(() -> new UniversiteNotFoundException(universiteId));

        // Vérifier que l'inscription appartient bien à cette université
        if (!inscription.getUniversite().getId().equals(universiteId)) {
            throw new RuntimeException("Cette inscription ne correspond pas a cette universite");
        }

        // ✅ Utilisation de l'enum StatutInscription pour la validation
        if (inscription.getStatut() != StatutInscription.VALIDE) {
            throw new RuntimeException(
                "Impossible de payer pour une inscription non validee (statut actuel : " + inscription.getStatut() + ")"
            );
        }

        Double montant = Double.valueOf(data.get("montant").toString());
        if (montant <= 0) {
            throw new RuntimeException("Le montant doit etre superieur a zero");
        }

        String devise = data.getOrDefault("devise", "USD").toString().toUpperCase().trim();
        double seuilMinimum = "CDF".equals(devise) ? 1000.0 : 1.0;
        if (montant < seuilMinimum) {
            throw new RuntimeException("Le montant minimum est de " + seuilMinimum + " " + devise);
        }

        TypePaiement type = TypePaiement.valueOf(
            data.getOrDefault("type", "FRAIS_ACADEMIQUES").toString()
        );
        ModePaiement mode = ModePaiement.valueOf(
            data.getOrDefault("modePaiement", "ESPECES").toString()
        );

        // Vérifier le solde total dû pour ce type de paiement.
        // L'année académique peut manquer sur d'anciennes inscriptions : la
        // déréférencer sans précaution transformait un versement en 500. Sans
        // année, aucun barème n'est identifiable — on laisse alors passer le
        // versement (totalDu = 0 neutralise le plafond ci-dessous) plutôt que
        // de bloquer la caisse sur une donnée historique incomplète.
        String anneeBareme = inscription.getAnneeAcademique() != null
                ? inscription.getAnneeAcademique().getLibelle()
                : null;
        Double totalDu = anneeBareme == null ? 0.0
                : baremeRepo.findByUniversiteIdAndAnneeAcademiqueAndNiveauAndTypePaiement(
                        universiteId, anneeBareme, inscription.getNiveau(), type)
                .map(BaremePaiement::getMontantAttendu)
                .orElse(0.0);

        Double totalDejaPaye = paiementRepo.findByInscriptionIdAndTypeAndStatutIn(
                inscriptionId, type, java.util.List.of(StatutPaiement.VALIDE, StatutPaiement.EN_ATTENTE))
                .stream()
                .mapToDouble(Paiement::getMontant)
                .sum();

        if (totalDejaPaye + montant > totalDu && totalDu > 0) {
            throw new RuntimeException(
                "Montant depassant le solde dû (dû: " + totalDu + " " + devise + ", déjà payé: " + totalDejaPaye + " " + devise + ")"
            );
        }

        // Générer la référence unique et vérifier l'unicité. Une seule
        // regénération, non revérifiée, ne garantissait rien : on retente
        // jusqu'à obtenir une référence libre, et on échoue franchement plutôt
        // que d'enregistrer un doublon que la caisse ne saurait plus rapprocher.
        String reference = genererReference();
        for (int essai = 0; paiementRepo.existsByReference(reference); essai++) {
            if (essai >= 5) {
                throw new RuntimeException("Impossible de generer une reference de paiement unique");
            }
            reference = genererReference();
        }

        Paiement paiement = Paiement.builder()
            .reference(reference)
            .montant(montant)
            .devise(data.getOrDefault("devise", "USD").toString().toUpperCase().trim())
            .modePaiement(mode)
            .statut(StatutPaiement.EN_ATTENTE)
            .type(type)
            .datePaiement(LocalDate.now())
            .numeroTransaction((String) data.get("numeroTransaction"))
            .operateur((String) data.get("operateur"))
            .notesCaisse((String) data.get("notesCaisse"))
            .inscription(inscription)
            .universite(universite)
            .agentId(data.get("agentId") != null ? Long.valueOf(data.get("agentId").toString()) : null)
            .build();

        // Si un agent de caisse effectue l'enregistrement en espèces, validation automatique immédiate
        if (data.get("agentId") != null && mode == ModePaiement.ESPECES) {
            paiement.setStatut(StatutPaiement.VALIDE);
            paiement.setDateValidation(LocalDate.now());
        }

        return paiementRepo.save(paiement);
    }

    /**
     * Soumet un paiement depuis le portail étudiant (toujours en attente)
     */
    @Transactional
    public Paiement soumettreParEtudiant(Map<String, Object> data) {
        Long inscriptionId = Long.valueOf(data.get("inscriptionId").toString());
        Long universiteId  = Long.valueOf(data.get("universiteId").toString());

        Inscription inscription = inscriptionRepo.findById(inscriptionId)
            .orElseThrow(() -> new InscriptionNotFoundException(inscriptionId));

        Universite universite = universiteRepo.findById(universiteId)
            .orElseThrow(() -> new UniversiteNotFoundException(universiteId));

        if (!inscription.getUniversite().getId().equals(universiteId)) {
            throw new RuntimeException("Cette inscription ne correspond pas a cette universite");
        }

        // ✅ Ajout de la validation du statut pour le portail étudiant également
        if (inscription.getStatut() != StatutInscription.VALIDE) {
            throw new RuntimeException(
                "Impossible de payer pour une inscription non validee (statut actuel : " + inscription.getStatut() + ")"
            );
        }

        Double montant = Double.valueOf(data.get("montant").toString());
        if (montant <= 0) {
            throw new RuntimeException("Le montant doit etre superieur a zero");
        }

        TypePaiement type = TypePaiement.valueOf(
            data.getOrDefault("type", "FRAIS_ACADEMIQUES").toString()
        );
        ModePaiement mode = ModePaiement.valueOf(
            data.getOrDefault("modePaiement", "MOBILE_MONEY").toString()
        );

        String reference = genererReference();

        Paiement paiement = Paiement.builder()
            .reference(reference)
            .montant(montant)
            .devise(data.getOrDefault("devise", "USD").toString().toUpperCase().trim())
            .modePaiement(mode)
            .statut(StatutPaiement.EN_ATTENTE)
            .type(type)
            .datePaiement(LocalDate.now())
            .numeroTransaction((String) data.get("numeroTransaction"))
            .operateur((String) data.get("operateur"))
            .notesCaisse((String) data.get("notesCaisse"))
            .inscription(inscription)
            .universite(universite)
            .agentId(null)
            .build();

        return paiementRepo.save(paiement);
    }

    // ══════════════════════════════════════════
    // VALIDATION / REJET (Agent de caisse)
    // ══════════════════════════════════════════

    @Transactional
    public Paiement valider(Long id, Long agentId, String notes) {
        Paiement p = obtenir(id);

        if (p.getStatut() != StatutPaiement.EN_ATTENTE) {
            throw new RuntimeException("Ce paiement n'est pas en attente (statut : " + p.getStatut() + ")");
        }

        p.setStatut(StatutPaiement.VALIDE);
        p.setDateValidation(LocalDate.now());
        p.setAgentId(agentId);
        if (notes != null) p.setNotesCaisse(notes);

        return paiementRepo.save(p);
    }

    @Transactional
    public Paiement rejeter(Long id, Long agentId, String motif) {
        Paiement p = obtenir(id);

        if (p.getStatut() != StatutPaiement.EN_ATTENTE) {
            throw new RuntimeException("Ce paiement n'est pas en attente");
        }

        p.setStatut(StatutPaiement.REJETE);
        p.setDateValidation(LocalDate.now());
        p.setAgentId(agentId);
        p.setMotifRejet(motif);

        return paiementRepo.save(p);
    }

    @Transactional
    public Paiement rembourser(Long id, Long agentId, String motif) {
        Paiement p = obtenir(id);

        if (p.getStatut() != StatutPaiement.VALIDE) {
            throw new RuntimeException("Seuls les paiements valides peuvent etre rembourses");
        }

        p.setStatut(StatutPaiement.REMBOURSE);
        p.setAgentId(agentId);
        p.setMotifRejet(motif);

        return paiementRepo.save(p);
    }

    // ══════════════════════════════════════════
    // CONSULTATION (READ-ONLY)
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public Paiement obtenir(Long id) {
        return paiementRepo.findById(id)
            .orElseThrow(() -> new PaiementNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public Paiement obtenirParReference(String reference) {
        return paiementRepo.findByReference(reference)
            .orElseThrow(() -> new PaiementNotFoundException(reference));
    }

    @Transactional(readOnly = true)
    public List<Paiement> paiementsParInscription(Long inscriptionId) {
        return paiementRepo.findByInscriptionId(inscriptionId);
    }

    @Transactional(readOnly = true)
    public Page<Paiement> paiementsParInscriptionPagines(Long inscriptionId, Pageable pageable) {
        return paiementRepo.findByInscriptionId(inscriptionId, pageable);
    }

    @Transactional(readOnly = true)
    public List<Paiement> paiementsEnAttente(Long universiteId) {
        return paiementRepo.findByUniversiteIdAndStatut(universiteId, StatutPaiement.EN_ATTENTE);
    }

    @Transactional(readOnly = true)
    public Page<Paiement> paiementsEnAttentePagines(Long universiteId, Pageable pageable) {
        return paiementRepo.findByUniversiteIdAndStatut(universiteId, StatutPaiement.EN_ATTENTE, pageable);
    }

    @Transactional(readOnly = true)
    public List<Paiement> paiementsDuJour(Long universiteId) {
        return paiementRepo.paiementsDuJour(universiteId, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public Page<Paiement> paiementsParUniversitePagines(Long universiteId, Pageable pageable) {
        return paiementRepo.findByUniversiteId(universiteId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Paiement> paiementsDuJourPagines(Long universiteId, Pageable pageable) {
        return paiementRepo.findByUniversiteIdAndDatePaiement(universiteId, LocalDate.now(), pageable);
    }

    // ══════════════════════════════════════════
    // SOLDE ET SITUATION FINANCIÈRE ÉTUDIANT
    // ══════════════════════════════════════════

    /**
     * Retourne la situation financière complète d'un étudiant
     * ✅ Une seule transaction pour tous les calculs
     */
    @Transactional(readOnly = true)
    public Map<String, Object> situationFinanciere(Long inscriptionId) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
            .orElseThrow(() -> new InscriptionNotFoundException(inscriptionId));

        List<Paiement> tousLesPaiements = paiementRepo.findByInscriptionId(inscriptionId);
        double totalPaye = paiementRepo.totalValideParInscription(inscriptionId);

        // Calculer le montant attendu depuis le barème
        double montantAttendu = calculerMontantAttendu(inscription);
        double soldeRestant = Math.max(0, montantAttendu - totalPaye);
        double pourcentage = montantAttendu > 0 ? Math.min(100, (totalPaye / montantAttendu) * 100) : 0;

        List<Paiement> payes = tousLesPaiements.stream()
            .filter(p -> p.getStatut() == StatutPaiement.VALIDE)
            .toList();
        List<Paiement> enAttente = tousLesPaiements.stream()
            .filter(p -> p.getStatut() == StatutPaiement.EN_ATTENTE)
            .toList();

        String libelleAnnee = (inscription.getAnneeAcademique() != null) 
            ? inscription.getAnneeAcademique().getLibelle() : "—";

        String nomEtudiant = "—";
        if (inscription.getEtudiant() != null) {
            nomEtudiant = inscription.getEtudiant().getPrenom() + " " + inscription.getEtudiant().getNom();
        }

        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("matricule", inscription.getMatricule());
        resultat.put("etudiant", nomEtudiant);
        resultat.put("universite", inscription.getUniversite() != null ? inscription.getUniversite().getNom() : "—");
        resultat.put("departement", inscription.getDepartement() != null ? inscription.getDepartement().getNom() : "—");
        resultat.put("niveau", inscription.getPromotion() != null ? inscription.getPromotion().getLibelle() : "—");
        resultat.put("anneeAcademique", libelleAnnee);
        resultat.put("montantAttendu", montantAttendu);
        resultat.put("totalPaye", totalPaye);
        resultat.put("soldeRestant", soldeRestant);
        resultat.put("pourcentage", Math.round(pourcentage));
        resultat.put("estSolde", soldeRestant == 0);
        resultat.put("nbPaiementsValides", payes.size());
        resultat.put("nbPaiementsEnAttente", enAttente.size());
        resultat.put("paiements", tousLesPaiements);
        return resultat;
    }

    /**
     * Vérifie si un étudiant a des dettes impayées des années précédentes
     */
    @Transactional(readOnly = true)
    public boolean aDesDettes(Long inscriptionId) {
        Map<String, Object> situation = situationFinanciere(inscriptionId);
        double solde = (double) situation.getOrDefault("soldeRestant", 0.0);
        return solde > 0;
    }

    /**
     * Récupère toutes les dettes d'un étudiant (année par année)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> dettesParAnnee(Long etudiantId) {
        List<Inscription> inscriptions = inscriptionRepo.findByEtudiant_Id(etudiantId);
        Map<String, Object> dettes = new LinkedHashMap<>();
        double totalDettes = 0;

        for (Inscription ins : inscriptions) {
            String annee = ins.getAnneeAcademique() != null ? ins.getAnneeAcademique().getLibelle() : "—";
            Map<String, Object> situation = situationFinanciere(ins.getId());
            double solde = (double) situation.getOrDefault("soldeRestant", 0.0);
            if (solde > 0) {
                dettes.put(annee, solde);
                totalDettes += solde;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalDettes", totalDettes);
        result.put("dettesParAnnee", dettes);
        return result;
    }

    // ══════════════════════════════════════════
    // REÇU DE PAIEMENT
    // ══════════════════════════════════════════

    /**
     * Génère les données claires du reçu pour l'impression client
     */
    @Transactional(readOnly = true)
    public Map<String, Object> genererRecu(Long paiementId) {
        Paiement p = obtenir(paiementId);
        Inscription ins = p.getInscription();

        if (p.getStatut() != StatutPaiement.VALIDE) {
            throw new RuntimeException("Impossible de generer un recu pour un paiement non valide");
        }

        String libelleAnnee = (ins.getAnneeAcademique() != null) 
            ? ins.getAnneeAcademique().getLibelle() : "—";
        
        String nomEtudiant = "—";
        if (ins.getEtudiant() != null) {
            nomEtudiant = ins.getEtudiant().getPrenom() + " " + ins.getEtudiant().getNom();
        }

        Map<String, Object> recu = new LinkedHashMap<>();
        recu.put("titre", "REÇU DE PAIEMENT — GENUC");
        recu.put("reference", p.getReference());
        recu.put("date", p.getDateValidation() != null ? p.getDateValidation().toString() : p.getDatePaiement().toString());
        recu.put("universite", p.getUniversite().getNom());
        recu.put("matricule", ins.getMatricule());
        recu.put("etudiant", nomEtudiant);
        recu.put("departement", ins.getDepartement().getNom());
        recu.put("niveau", ins.getPromotion() != null ? ins.getPromotion().getLibelle() : "—");
        recu.put("anneeAcademique", libelleAnnee);
        recu.put("typePaiement", p.getType().name().replace("_", " "));
        recu.put("montant", p.getMontant());
        recu.put("devise", p.getDevise());
        recu.put("modePaiement", p.getModePaiement().name().replace("_", " "));
        recu.put("operateur", p.getOperateur() != null ? p.getOperateur() : "—");
        recu.put("numeroTransaction", p.getNumeroTransaction() != null ? p.getNumeroTransaction() : "—");
        recu.put("statut", "VALIDÉ");
        recu.put("genereA", LocalDateTime.now().toString());
        return recu;
    }

    // ══════════════════════════════════════════
    // RAPPORTS FINANCIERS
    // ══════════════════════════════════════════

    /**
     * Génère le rapport journalier
     */
    @Transactional(readOnly = true)
    public Map<String, Object> rapportJournalier(Long universiteId) {
        LocalDate today = LocalDate.now();
        List<Paiement> paiements = paiementRepo.paiementsDuJour(universiteId, today);

        double totalJour = paiements.stream()
            .filter(p -> p.getStatut() == StatutPaiement.VALIDE)
            .mapToDouble(Paiement::getMontant).sum();

        long enAttente = paiementRepo.countEnAttente(universiteId);

        Map<String, Long> parMode = new LinkedHashMap<>();
        for (ModePaiement mode : ModePaiement.values()) {
            long count = paiements.stream()
                .filter(p -> p.getModePaiement() == mode && p.getStatut() == StatutPaiement.VALIDE)
                .count();
            if (count > 0) parMode.put(mode.name(), count);
        }

        return Map.of(
            "date", today.toString(),
            "totalCollecte", totalJour,
            "nbTransactions", paiements.stream().filter(p -> p.getStatut() == StatutPaiement.VALIDE).count(),
            "nbEnAttente", enAttente,
            "repartitionMode", parMode,
            "paiements", paiements
        );
    }

    /**
     * Génère le rapport mensuel
     */
    @Transactional(readOnly = true)
    public Map<String, Object> rapportMensuel(Long universiteId, int annee, int mois) {
        LocalDate debut = LocalDate.of(annee, mois, 1);
        LocalDate fin = debut.withDayOfMonth(debut.lengthOfMonth());

        double total = paiementRepo.totalCollecteParPeriode(universiteId, debut, fin);
        List<Paiement> paiements = paiementRepo.findByUniversiteIdAndDatePaiementBetween(universiteId, debut, fin);

        return Map.of(
            "periode", debut.getMonth().name() + " " + annee,
            "totalCollecte", total,
            "nbTransactions", paiements.stream().filter(p -> p.getStatut() == StatutPaiement.VALIDE).count(),
            "debut", debut.toString(),
            "fin", fin.toString()
        );
    }

    // ══════════════════════════════════════════
    // BARÈMES
    // ══════════════════════════════════════════

    @Transactional
    public BaremePaiement creerBareme(Map<String, Object> data) {
        Long universiteId = Long.valueOf(data.get("universiteId").toString());
        Universite universite = universiteRepo.findById(universiteId)
            .orElseThrow(() -> new UniversiteNotFoundException(universiteId));

        BaremePaiement bareme = BaremePaiement.builder()
            .anneeAcademique((String) data.get("anneeAcademique"))
            .niveau((String) data.get("niveau"))
            .typePaiement(TypePaiement.valueOf((String) data.get("typePaiement")))
            .montantAttendu(Double.valueOf(data.get("montantAttendu").toString()))
            .devise(data.getOrDefault("devise", "USD").toString().toUpperCase().trim())
            .departementId(data.get("departementId") != null ? Long.valueOf(data.get("departementId").toString()) : null)
            .universite(universite)
            .actif(true)
            .build();

        return baremeRepo.save(bareme);
    }

    @Transactional(readOnly = true)
    public List<BaremePaiement> listerBaremes(Long universiteId, String annee) {
        return baremeRepo.findByUniversiteIdAndAnneeAcademiqueAndActifTrue(universiteId, annee);
    }

    // ══════════════════════════════════════════
    // UTILITAIRES PRIVÉS
    // ══════════════════════════════════════════

    private String genererReference() {
        int annee = LocalDate.now().getYear();
        long seq = paiementRepo.countParAnnee(annee) + 1;
        return String.format("GEN-%d-%05d", annee, seq);
    }

    private double calculerMontantAttendu(Inscription inscription) {
        // Montant attendu = somme des frais attribués par l'admin pour LA
        // promotion + année de l'étudiant (mêmes frais que le portail TachPay).
        List<AffectationFrais> affectations = affectationRepo.findByInscriptionId(inscription.getId()).stream()
                .filter(af -> af.getStatut() != StatutAffectation.ANNULE)
                .filter(af -> estAttribuePourPromotionEtAnnee(af, inscription))
                .toList();

        if (!affectations.isEmpty()) {
            return affectations.stream().mapToDouble(AffectationFrais::getMontant).sum();
        }

        // Repli : barème historique tant qu'aucun frais n'a été attribué.
        return calculerMontantAttenduBareme(inscription);
    }

    private double calculerMontantAttenduBareme(Inscription inscription) {
        String libelleAnnee = (inscription.getAnneeAcademique() != null)
            ? inscription.getAnneeAcademique().getLibelle() : "—";
        String niveauLibelle = (inscription.getPromotion() != null)
            ? inscription.getPromotion().getLibelle() : "—";

        List<BaremePaiement> baremes = baremeRepo.findBareme(
            inscription.getUniversite().getId(),
            libelleAnnee,
            niveauLibelle,
            TypePaiement.FRAIS_ACADEMIQUES
        );

        if (!baremes.isEmpty()) {
            return baremes.get(0).getMontantAttendu();
        }

        return inscription.getUniversite().getFraisBase();
    }

    /**
     * Un frais n'est pris en compte que si l'admin l'a attribué pour LA
     * promotion ET L'année académique de l'inscription (même règle que le
     * portail étudiant TachPay).
     */
    private boolean estAttribuePourPromotionEtAnnee(AffectationFrais af, Inscription inscription) {
        Frais frais = af.getFrais();
        if (frais == null || inscription == null) {
            return false;
        }
        Long promotionInscription = inscription.getPromotion() != null
                ? inscription.getPromotion().getId() : null;
        if (frais.getPromotionId() == null
                || !frais.getPromotionId().equals(promotionInscription)) {
            return false;
        }
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
}