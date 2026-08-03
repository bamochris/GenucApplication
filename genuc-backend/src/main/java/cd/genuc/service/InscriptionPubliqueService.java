package cd.genuc.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import cd.genuc.dto.DossierInscriptionDto;
import cd.genuc.dto.InscriptionPubliqueRequest;
import cd.genuc.model.AnneeAcademique;
import cd.genuc.model.Departement;
import cd.genuc.model.DossierInscription;
import cd.genuc.model.DossierInscription.StatutDossier;
import cd.genuc.model.Etudiant;
import cd.genuc.model.Filiere;
import cd.genuc.model.Inscription;
import cd.genuc.model.Promotion;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.StatutInscription;   // ✅ IMPORT AJOUTÉ
import cd.genuc.model.Universite;
import cd.genuc.model.Utilisateur;
import cd.genuc.model.Vacation;
import cd.genuc.model.ParametresUniversite;
import cd.genuc.repository.AnneeAcademiqueRepository;
import cd.genuc.repository.DepartementRepository;
import cd.genuc.repository.DossierInscriptionRepository;
import cd.genuc.repository.EtudiantRepository;
import cd.genuc.repository.FiliereRepository;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.repository.PromotionRepository;
import cd.genuc.repository.UniversiteRepository;
import cd.genuc.repository.UtilisateurRepository;
import cd.genuc.repository.VacationRepository;
import cd.genuc.repository.ParametresUniversiteRepository;
import cd.genuc.service.EmailService;
import cd.genuc.service.SmsService;
import cd.genuc.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class InscriptionPubliqueService {

    private final DossierInscriptionRepository dossierRepo;
    private final EtudiantRepository etudiantRepo;
    private final InscriptionRepository inscriptionRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final UniversiteRepository universiteRepo;
    private final DepartementRepository departementRepo;
    private final FiliereRepository filiereRepo;
    private final PromotionRepository promotionRepo;
    private final AnneeAcademiqueRepository anneeRepo;
    private final VacationRepository vacationRepo;
    private final ParametresUniversiteRepository parametresRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SmsService smsService;
    private final WhatsAppService whatsAppService;
    private final cd.genuc.repository.TransactionDossierRepository transactionDossierRepo;
    private final cd.genuc.service.tachpay.MobileMoneyService mobileMoneyService;
    private final cd.genuc.service.tachpay.StripeService stripeService;
    private final StockageFichierService stockage;

    @Value("${app.base-url:http://localhost:3000}")
    private String appBaseUrl;

    // ─── 1. Soumission complète ──────────────────────────────────────

    @Transactional
    public DossierInscription soumettreDossierComplet(InscriptionPubliqueRequest req) {
        DossierInscription dossier = dossierRepo.save(construireDossier(req));
        notifierAccuseReception(dossier);
        return dossier;
    }

    /** Soumission avec pièces jointes : on construit le dossier puis on enregistre les fichiers. */
    @Transactional
    public DossierInscription soumettreDossierCompletAvecDocuments(
            InscriptionPubliqueRequest req, Map<String, MultipartFile> fichiers) {
        DossierInscription dossier = construireDossier(req);
        if (fichiers != null) {
            dossier.setUrlPhoto(enregistrerFichier(fichiers.get("urlPhoto")));
            dossier.setUrlPhotoPasseport(enregistrerFichier(fichiers.get("urlPhotoPasseport")));
            dossier.setUrlDiplomeEtat(enregistrerFichier(fichiers.get("urlDiplomeEtat")));
            dossier.setUrlAttestationReussite(enregistrerFichier(fichiers.get("urlAttestationReussite")));
            dossier.setUrlReleveNotes(enregistrerFichier(fichiers.get("urlReleveNotes")));
            dossier.setUrlActeNaissance(enregistrerFichier(fichiers.get("urlActeNaissance")));
            dossier.setUrlAttestationNationalite(enregistrerFichier(fichiers.get("urlAttestationNationalite")));
            dossier.setUrlCarteIdentite(enregistrerFichier(fichiers.get("urlCarteIdentite")));
            dossier.setUrlLettreRecommandation(enregistrerFichier(fichiers.get("urlLettreRecommandation")));
            dossier.setUrlAttestationPhysique(enregistrerFichier(fichiers.get("urlAttestationPhysique")));
            dossier.setUrlAttestationConduite(enregistrerFichier(fichiers.get("urlAttestationConduite")));
        }
        dossier = dossierRepo.save(dossier);
        notifierAccuseReception(dossier);
        return dossier;
    }

    /** Construit (sans sauvegarder) un dossier à partir de la requête et valide les règles métier. */
    private DossierInscription construireDossier(InscriptionPubliqueRequest req) {
        if (dossierRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Un dossier existe déjà avec cet email");
        }
        if (etudiantRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Un étudiant est déjà inscrit avec cet email");
        }
        if (req.getTelephone1() != null && !req.getTelephone1().isBlank() && dossierRepo.existsByTelephone(req.getTelephone1())) {
            throw new RuntimeException("Un dossier existe déjà avec ce numéro de téléphone");
        }

        if (req.getUniversiteId() == null)      throw new RuntimeException("L'université est obligatoire.");
        if (req.getDepartementId() == null)     throw new RuntimeException("Le département est obligatoire.");
        if (req.getFiliereId() == null)         throw new RuntimeException("La filière est obligatoire.");
        if (req.getAnneeAcademiqueId() == null) throw new RuntimeException("L'année académique est obligatoire.");

        // Règle d'admission : le code EXETAT est obligatoire pour un Diplôme d'État
        // obtenu en 2022 ou après (il sera vérifié sur la plateforme officielle).
        if (exetatObligatoire(req.getAnneeObtention())
                && (req.getCodeExetat() == null || req.getCodeExetat().isBlank())) {
            throw new RuntimeException(
                "Le code EXETAT est obligatoire pour un diplôme d'État obtenu en 2022 ou après.");
        }

        Universite uni = universiteRepo.findById(req.getUniversiteId())
            .orElseThrow(() -> new RuntimeException("Université introuvable"));
        Departement dept = departementRepo.findById(req.getDepartementId())
            .orElseThrow(() -> new RuntimeException("Département introuvable"));
        Filiere filiere = filiereRepo.findById(req.getFiliereId())
            .orElseThrow(() -> new RuntimeException("Filière introuvable"));

        if (!dept.getUniversite().getId().equals(uni.getId())) {
            throw new RuntimeException("Le département n'appartient pas à cette université");
        }

        DossierInscription dossier = DossierInscription.builder()
            .nom(req.getNom().toUpperCase())
            .prenom(req.getPrenom())
            .email(req.getEmail().toLowerCase().trim())
            .telephone(req.getTelephone1())
            .motDePasse(req.getMotDePasse())
            .sexe(req.getSexe())
            .lieuNaissance(req.getLieuNaissance())
            .dateNaissance(req.getDateNaissance())
            .adresse(buildAdresse(req))
            .niveauVise(req.getNiveauVise())
            .universiteId(req.getUniversiteId())
            .departementId(req.getDepartementId())
            .filiereId(req.getFiliereId())
            .ecoleSecondaire(req.getEcoleSecondaire())
            .provinceEcole(req.getProvinceEcole())
            .anneeObtention(req.getAnneeObtention())
            .numeroDiplome(req.getNumeroDiplome())
            .pourcentage(req.getPourcentage())
            .option(req.getOption())
            .codeExetat(req.getCodeExetat() != null ? req.getCodeExetat().trim() : null)
            .pereNom(req.getPereNom())
            .pereProfession(req.getPereProfession())
            .pereTelephone(req.getPereTelephone())
            .mereNom(req.getMereNom())
            .mereProfession(req.getMereProfession())
            .mereTelephone(req.getMereTelephone())
            .tuteurNom(req.getTuteurNom())
            .tuteurLien(req.getTuteurLien())
            .tuteurTelephone(req.getTuteurTelephone())
            .tuteurAdresse(req.getTuteurAdresse())
            .urgenceNom(req.getUrgenceNom())
            .urgenceTelephone(req.getUrgenceTelephone())
            .allergies(req.getAllergies())
            .handicap(req.getHandicap())
            .modePaiement(req.getModePaiement())
            .numeroTransaction(req.getNumeroTransaction())
            .bourse(req.getBourse() != null && req.getBourse())
            .montantPaye(req.getMontantPaye() != null ? req.getMontantPaye() : 0.0)
            .statut(StatutDossier.EN_ATTENTE)
            .build();

        dossier.setNumeroDossier(genererNumeroDossier(uni));
        appliquerVacationEtFrais(dossier, uni, req.getVacationId());
        return dossier;
    }

    // Mots non significatifs ignorés lors du calcul du préfixe d'établissement.
    private static final java.util.Set<String> MOTS_VIDES = java.util.Set.of(
        "DE", "DU", "DES", "LA", "LE", "LES", "L", "D", "ET", "EN", "A", "AU", "AUX");

    /**
     * Préfixe du numéro de dossier propre à l'établissement :
     *  - nom en un seul mot court (sigle type « UPN »)  → le sigle entier ;
     *  - nom commençant par « Université »              → initiales des mots significatifs
     *    (Université de Kinshasa → UK, Université Pédagogique Nationale → UPN) ;
     *  - autres noms                                    → deux premières lettres
     *    (Haute École de Commerce → HA).
     */
    static String prefixeEtablissement(String nom) {
        if (nom == null || nom.isBlank()) {
            return "";
        }
        String sansAccents = java.text.Normalizer.normalize(nom, java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "").toUpperCase(java.util.Locale.ROOT);
        List<String> mots = new java.util.ArrayList<>();
        for (String mot : sansAccents.split("[^A-Z]+")) {
            if (!mot.isBlank() && !MOTS_VIDES.contains(mot)) {
                mots.add(mot);
            }
        }
        if (mots.isEmpty()) {
            return "";
        }
        if (mots.size() == 1) {
            String seul = mots.get(0);
            return seul.length() <= 4 ? seul : seul.substring(0, 2);
        }
        if (mots.get(0).equals("UNIVERSITE")) {
            StringBuilder initiales = new StringBuilder();
            for (String mot : mots) {
                initiales.append(mot.charAt(0));
            }
            return initiales.substring(0, Math.min(4, initiales.length()));
        }
        return mots.get(0).substring(0, Math.min(2, mots.get(0).length()));
    }

    /** Numéro de dossier « <préfixe établissement>DOS-<année>-<6 chiffres> », garanti unique. */
    private String genererNumeroDossier(Universite uni) {
        String prefixe = prefixeEtablissement(uni.getNom());
        int annee = LocalDate.now().getYear();
        for (int essai = 0; essai < 50; essai++) {
            String numero = String.format("%sDOS-%d-%06d", prefixe, annee,
                java.util.concurrent.ThreadLocalRandom.current().nextInt(1_000_000));
            if (dossierRepo.findByNumeroDossier(numero).isEmpty()) {
                return numero;
            }
        }
        throw new RuntimeException("Impossible de générer un numéro de dossier unique, veuillez réessayer.");
    }

    /**
     * Vacation et frais d'inscription selon l'offre de l'établissement.
     *
     * <p>Ordre de priorité :</p>
     * <ol>
     *   <li>la vacation choisie, si le candidat en transmet une ;</li>
     *   <li>{@code ParametresUniversite.fraisInscription} — le champ que
     *       l'écran « Paramètres de l'établissement » alimente réellement ;</li>
     *   <li>{@code Universite.fraisInscription}, conservé pour les fiches
     *       antérieures à ce module de paramétrage.</li>
     * </ol>
     *
     * <p>Ce deuxième niveau manquait : l'administrateur saisissait des frais dans
     * ParametresUniversite tandis que le dépôt lisait Universite — deux champs
     * homonymes portés par deux entités distinctes. Le montant saisi restait donc
     * sans effet, et le dossier partait avec un montant nul.</p>
     *
     * <p>Aucun montant résolu fait désormais échouer le dépôt avec un message
     * explicite : un dossier sans montant traverse tout le parcours et n'échoue
     * qu'au paiement, là où le candidat ne peut rien y faire. Un établissement
     * qui n'exige rien saisit 0, ce qui est une valeur, pas une absence.</p>
     */
    // Visibilité paquet plutôt que private : la résolution des frais porte une règle
    // de priorité qui a déjà silencieusement échoué une fois, elle mérite un test
    // direct sans monter tout le parcours de dépôt en doublures.
    void appliquerVacationEtFrais(DossierInscription dossier, Universite uni, Long vacationId) {
        // La campagne/vacation n'est plus une étape obligatoire du parcours candidat.
        // Si une vacation est tout de même transmise, on l'honore (frais = ceux de la
        // vacation) ; sinon, les frais définis au niveau de l'université s'appliquent.
        if (vacationId != null) {
            Vacation choisie = vacationRepo.findInscriptionsOuvertes(uni.getId(), LocalDate.now()).stream()
                .filter(v -> v.getId().equals(vacationId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                    "La vacation choisie n'est pas ouverte aux inscriptions dans cet établissement."));
            dossier.setVacationId(choisie.getId());
            dossier.setMontantInscription(choisie.getFraisInscription());
            dossier.setDeviseInscription(choisie.getDeviseFrais());
            return;
        }
        Double frais = parametresRepo.findByUniversiteId(uni.getId())
            .map(ParametresUniversite::getFraisInscription)
            .orElse(null);
        if (frais == null) {
            frais = uni.getFraisInscription();
        }
        if (frais == null) {
            throw new RuntimeException(
                "Les frais de dossier ne sont pas définis pour cet établissement. "
                + "Contactez le secrétariat : le dépôt ne peut pas être enregistré sans montant.");
        }
        dossier.setMontantInscription(frais);
        dossier.setDeviseInscription(deviseParDefaut(uni.getDevise()));
    }

    /** Le code EXETAT est exigé pour un Diplôme d'État obtenu en 2022 ou après. */
    private boolean exetatObligatoire(String anneeObtention) {
        Integer annee = anneeDiplome(anneeObtention);
        return annee != null && annee >= 2022;
    }

    /** Extrait l'année (ex. "2024") d'une chaîne, ou null si illisible. */
    private Integer anneeDiplome(String txt) {
        if (txt == null) return null;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d{4})").matcher(txt);
        return m.find() ? Integer.valueOf(m.group(1)) : null;
    }

    /** L'université peut stocker plusieurs devises (« USD/CDF ») : la première sert de défaut. */
    private String deviseParDefaut(String devise) {
        if (devise == null || devise.isBlank()) {
            return "USD";
        }
        return devise.split("/")[0].trim();
    }

    private String buildAdresse(InscriptionPubliqueRequest req) {
        if (req.getAdresse() != null && !req.getAdresse().isEmpty()) {
            return req.getAdresse();
        }
        return String.join(", ",
            req.getAvenue() != null ? req.getAvenue() : "",
            req.getQuartier() != null ? req.getQuartier() : "",
            req.getCommune() != null ? req.getCommune() : "",
            req.getVille() != null ? req.getVille() : ""
        ).replaceAll("(, )+", ", ").replaceAll("^, |, $", "").trim();
    }

    // ─── 2. Soumission simple ────────────────────────────────────────

    @Transactional
    public DossierInscription soumettre(DossierInscriptionDto dto) {
        if (dossierRepo.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Un dossier existe déjà avec cet email");
        }
        if (etudiantRepo.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Un étudiant est déjà inscrit avec cet email");
        }

        Universite uni = universiteRepo.findById(dto.getUniversiteId())
            .orElseThrow(() -> new RuntimeException("Université introuvable"));
        Departement dept = departementRepo.findById(dto.getDepartementId())
            .orElseThrow(() -> new RuntimeException("Département introuvable"));
        Filiere filiere = filiereRepo.findById(dto.getFiliereId())
            .orElseThrow(() -> new RuntimeException("Filière introuvable"));

        if (!dept.getUniversite().getId().equals(uni.getId())) {
            throw new RuntimeException("Le département n'appartient pas à cette université");
        }

        DossierInscription dossier = DossierInscription.builder()
            .nom(dto.getNom().toUpperCase())
            .prenom(dto.getPrenom())
            .email(dto.getEmail().toLowerCase().trim())
            .telephone(dto.getTelephone())
            .motDePasse(dto.getMotDePasse())
            .sexe(dto.getSexe())
            .lieuNaissance(dto.getLieuNaissance())
            .dateNaissance(dto.getDateNaissance())
            .adresse(dto.getAdresse())
            .niveauVise(dto.getNiveauVise())
            .universiteId(dto.getUniversiteId())
            .departementId(dto.getDepartementId())
            .filiereId(dto.getFiliereId())
            .urlPhoto(dto.getUrlPhoto())
            .urlActeNaissance(dto.getUrlActeNaissance())
            .urlDiplomeEtat(dto.getUrlDiplomeEtat())
            .statut(StatutDossier.EN_ATTENTE)
            .build();

        dossier.setNumeroDossier(genererNumeroDossier(uni));
        appliquerVacationEtFrais(dossier, uni, dto.getVacationId());

        dossier = dossierRepo.save(dossier);
        notifierAccuseReception(dossier);
        return dossier;
    }

    // ─── 3. Lister les dossiers ─────────────────────────────────────

    public List<DossierInscription> listerParUniversite(Long universiteId, String statut) {
        List<DossierInscription> dossiers = (statut != null && !statut.isEmpty())
            ? dossierRepo.findByUniversiteIdAndStatutOrderByCreeLeDesc(universiteId, StatutDossier.valueOf(statut))
            : dossierRepo.findByUniversiteIdOrderByCreeLeDesc(universiteId);

        // Renseigne le champ calculé testAdmissionRequis (piloter la bannière du
        // secrétariat), en chargeant les drapeaux de filière en une seule requête.
        Set<Long> filiereIds = dossiers.stream()
            .map(DossierInscription::getFiliereId).filter(Objects::nonNull)
            .collect(Collectors.toCollection(HashSet::new));
        Map<Long, Boolean> exigeParFiliere = filiereIds.isEmpty() ? Map.of()
            : filiereRepo.findAllById(filiereIds).stream()
                .collect(Collectors.toMap(Filiere::getId, Filiere::isTestAdmissionRequis));
        for (DossierInscription d : dossiers) {
            boolean flag = d.getFiliereId() != null
                && Boolean.TRUE.equals(exigeParFiliere.get(d.getFiliereId()));
            d.setTestAdmissionRequis(testAdmissionRequis(d, flag));
        }
        return dossiers;
    }

    // ─── 4. Obtenir un dossier par ID ──────────────────────────────

    public DossierInscription obtenir(Long id) {
        return dossierRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));
    }

    // ─── 5. Obtenir un dossier par email ────────────────────────────

    public DossierInscription getDossierByEmail(String email) {
        return dossierRepo.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Aucun dossier trouvé pour l'email : " + email));
    }

    // ─── 6. Obtenir un dossier par numéro de dossier ────────────────

    public DossierInscription getDossierByNumero(String numeroDossier) {
        return dossierRepo.findByNumeroDossier(numeroDossier)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable avec le numéro : " + numeroDossier));
    }

    // ─── 7. Valider un dossier ──────────────────────────────────────

    @Transactional
    public Map<String, Object> validerDossier(Long dossierId, Long adminId, String commentaire) {
        DossierInscription dossier = obtenir(dossierId);

        if (dossier.getStatut() != StatutDossier.EN_ATTENTE) {
            throw new RuntimeException("Ce dossier n'est plus en attente");
        }
        // Le dossier n'est traité par les admissions qu'après paiement des frais
        // (branche « En attente de paiement » de l'organigramme). Les boursiers,
        // dispensés de frais, ne sont pas soumis à cette condition.
        if (!Boolean.TRUE.equals(dossier.getFraisInscriptionPayes()) && !Boolean.TRUE.equals(dossier.getBourse())) {
            throw new RuntimeException("Les frais de dossier ne sont pas encore payés : le dossier n'a pas encore été transmis aux admissions.");
        }
        // Vérification du Diplôme d'État : pour un diplôme obtenu en 2022 ou après,
        // le code EXETAT doit d'abord être vérifié sur la plateforme officielle.
        if (exetatObligatoire(dossier.getAnneeObtention()) && !Boolean.TRUE.equals(dossier.getExetatVerifie())) {
            throw new RuntimeException("Le code EXETAT (diplôme d'État obtenu en 2022 ou après) doit être vérifié sur la plateforme officielle avant de valider l'admission.");
        }
        if (testAdmissionRequis(dossier)) {
            throw new RuntimeException("Ce candidat doit d'abord réussir le TEST D'ADMISSION (exigé par la filière ou diplôme d'État < 60%). Convoquez-le au test, puis marquez le test réussi avant de valider.");
        }

        Universite uni = universiteRepo.findById(dossier.getUniversiteId())
            .orElseThrow(() -> new RuntimeException("Université introuvable"));
        Departement dept = departementRepo.findById(dossier.getDepartementId())
            .orElseThrow(() -> new RuntimeException("Département introuvable"));
        Filiere filiere = filiereRepo.findById(dossier.getFiliereId())
            .orElseThrow(() -> new RuntimeException("Filière introuvable"));
        AnneeAcademique anneeCourante = getAnneeCourante(uni);

        String emailNorm = dossier.getEmail().toLowerCase().trim();
        Etudiant etudiant = etudiantRepo.findByEmail(emailNorm).orElse(null);

        if (etudiant != null) {
            boolean dejaInscritPourAnnee = inscriptionRepo.findByEtudiant_Id(etudiant.getId()).stream()
                .anyMatch(inscription -> inscription.getUniversite() != null
                    && inscription.getAnneeAcademique() != null
                    && inscription.getStatut() != StatutInscription.REJETE
                    && Objects.equals(inscription.getUniversite().getId(), uni.getId())
                    && Objects.equals(inscription.getAnneeAcademique().getId(), anneeCourante.getId()));

            if (dejaInscritPourAnnee) {
                throw new RuntimeException("Un étudiant avec cet email possède déjà une inscription active dans cette université pour l'année académique en cours.");
            }

            etudiant.setNom(dossier.getNom());
            etudiant.setPrenom(dossier.getPrenom());
            etudiant.setTelephone(dossier.getTelephone());
            etudiant.setSexe(dossier.getSexe());
            etudiant.setLieuNaissance(dossier.getLieuNaissance());
            etudiant.setDateNaissance(dossier.getDateNaissance());
            etudiant.setAdresse(dossier.getAdresse());
            etudiant.setActif(true);
        } else {
            etudiant = Etudiant.builder()
                .nom(dossier.getNom())
                .prenom(dossier.getPrenom())
                .email(emailNorm)
                .telephone(dossier.getTelephone())
                .sexe(dossier.getSexe())
                .lieuNaissance(dossier.getLieuNaissance())
                .dateNaissance(dossier.getDateNaissance())
                .adresse(dossier.getAdresse())
                .actif(true)
                .build();
        }
        etudiant = etudiantRepo.save(etudiant);

        Promotion promotion = promotionRepo.findByFiliereId(filiere.getId()).stream()
            .filter(p -> p.getLibelle() != null && p.getLibelle().equalsIgnoreCase(dossier.getNiveauVise()))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Promotion introuvable pour le niveau: " + dossier.getNiveauVise()));

        String matricule = genererMatricule(uni, anneeCourante);

        // ✅ CORRECTION : utilisation de StatutInscription.VALIDE
        Inscription inscription = Inscription.builder()
            .etudiant(etudiant)
            .universite(uni)
            .departement(dept)
            .filiere(filiere)
            .promotion(promotion)
            .anneeAcademique(anneeCourante)
            .dossierInscriptionId(dossier.getId())
            .nom(dossier.getNom())
            .prenom(dossier.getPrenom())
            .email(dossier.getEmail())
            .telephone(dossier.getTelephone())
            .dateNaissance(dossier.getDateNaissance())
            .lieuNaissance(dossier.getLieuNaissance())
            .sexe(dossier.getSexe())
            .adresse(dossier.getAdresse())
            .niveau(dossier.getNiveauVise())
            .matricule(matricule)
            .statut(StatutInscription.VALIDE)   // ✅ CORRECTION
            .commentaire(commentaire)
            .build();
        inscription = inscriptionRepo.save(inscription);

        // Réutilise le compte s'il existe déjà (créé lors d'une demande de documents — email unique).
        Utilisateur utilisateur = utilisateurRepo.findByEmail(dossier.getEmail()).orElse(null);
        String tokenActivation;
        if (utilisateur == null) {
            tokenActivation = UUID.randomUUID().toString();
            utilisateur = Utilisateur.builder()
                .nom(dossier.getNom())
                .prenom(dossier.getPrenom())
                .email(dossier.getEmail())
                // Mot de passe provisoire (non-null : contrainte DB) ; remplacé par le vrai à l'activation.
                .motDePasse(passwordEncoder.encode(UUID.randomUUID().toString()))
                .telephone(dossier.getTelephone())
                .role(RoleEnum.ETUDIANT)
                .universiteId(uni.getId())
                .departementId(dept.getId())
                .inscriptionId(inscription.getId())
                .compteActive(false)
                .tokenActivation(tokenActivation)
                .tokenExpiration(LocalDateTime.now().plusHours(48))
                .actif(true)
                .build();
        } else {
            utilisateur.setInscriptionId(inscription.getId());
            utilisateur.setUniversiteId(uni.getId());
            utilisateur.setDepartementId(dept.getId());
            if (utilisateur.isCompteActive()) {
                tokenActivation = null;   // déjà activé : l'étudiant a déjà son mot de passe
            } else {
                tokenActivation = utilisateur.getTokenActivation() != null
                    ? utilisateur.getTokenActivation() : UUID.randomUUID().toString();
                utilisateur.setTokenActivation(tokenActivation);
                utilisateur.setTokenExpiration(LocalDateTime.now().plusHours(48));
            }
        }
        utilisateur = utilisateurRepo.save(utilisateur);

        if (tokenActivation != null) {
            try { emailService.envoyerEmailActivation(utilisateur, tokenActivation, matricule); }
            catch (Exception e) { log.warn("Email d'activation non envoyé à {} : {}", utilisateur.getEmail(), e.getMessage()); }
        }

        // ── Lettre d'admission officielle ──────────────────────────────
        String anneeLibelle = anneeCourante.getLibelle();
        long seq = inscriptionRepo.countByUniversite_IdAndAnneeAcademique_Id(uni.getId(), anneeCourante.getId());
        String numeroLettre = String.format("%s/ADM/%d/%05d",
            uni.getCode().toUpperCase(),
            LocalDate.now().getYear(),
            seq);
        try {
            emailService.envoyerLettreAcceptation(dossier, uni, dept, filiere,
                matricule, anneeLibelle, null, numeroLettre);
        } catch (Exception e) {
            log.warn("Lettre d'acceptation non envoyée à {} : {}", dossier.getEmail(), e.getMessage());
        }

        String telephone = dossier.getTelephone();
        if (telephone != null && !telephone.isBlank()) {
            String messageSms = "GENUC: Votre dossier a été validé. Matricule: " + matricule
                + ". Vérifiez votre email pour la lettre d'admission et le lien d'activation.";
            try {
                smsService.envoyerSms(telephone, messageSms);
                whatsAppService.envoyerMessage(telephone, messageSms);
            } catch (Exception e) {
                log.warn("SMS/WhatsApp de validation non envoyé à {} : {}", telephone, e.getMessage());
            }
        }

        dossier.setStatut(StatutDossier.VALIDE);
        dossier.setCommentaire(commentaire);
        dossierRepo.save(dossier);

        return Map.of(
            "message", "Dossier validé avec succès. Email d'activation et lettre d'admission envoyés.",
            "matricule", matricule,
            "email", etudiant.getEmail(),
            "tokenActivation", tokenActivation != null ? tokenActivation : "",
            "utilisateurId", utilisateur.getId(),
            "inscriptionId", inscription.getId(),
            "numeroLettre", numeroLettre
        );
    }

    // ─── 8. Générer le HTML de la lettre d'admission ───────────────

    public String genererLettre(Long dossierId) {
        DossierInscription dossier = obtenir(dossierId);
        if (dossier.getStatut() != DossierInscription.StatutDossier.VALIDE) {
            throw new RuntimeException("La lettre n'est disponible que pour les dossiers validés");
        }
        Universite uni = universiteRepo.findById(dossier.getUniversiteId())
            .orElseThrow(() -> new RuntimeException("Université introuvable"));
        Departement dept = departementRepo.findById(dossier.getDepartementId())
            .orElseThrow(() -> new RuntimeException("Département introuvable"));
        Filiere filiere = filiereRepo.findById(dossier.getFiliereId())
            .orElseThrow(() -> new RuntimeException("Filière introuvable"));
        AnneeAcademique annee = getAnneeCourante(uni);

        long seq = inscriptionRepo.countByUniversite_IdAndAnneeAcademique_Id(uni.getId(), annee.getId());
        String numeroLettre = String.format("%s/ADM/%d/%05d",
            uni.getCode().toUpperCase(), LocalDate.now().getYear(), seq);

        String matricule = trouverInscriptionPourDossierValide(dossier, uni)
            .map(Inscription::getMatricule)
            .orElse("EN-ATTENTE");

        return emailService.genererHtmlLettre(dossier, uni, dept, filiere,
            matricule, annee.getLibelle(), null, numeroLettre);
    }

    public Map<String, Object> verifierDocumentAdmission(String numeroDossier, String matricule, String universiteCode) {
        if (numeroDossier == null || numeroDossier.isBlank()) {
            throw new RuntimeException("Le numero de dossier est obligatoire.");
        }
        if (matricule == null || matricule.isBlank()) {
            throw new RuntimeException("Le matricule est obligatoire.");
        }
        if (universiteCode == null || universiteCode.isBlank()) {
            throw new RuntimeException("Le code de l'universite est obligatoire.");
        }

        DossierInscription dossier = dossierRepo.findByNumeroDossier(numeroDossier.trim())
            .orElseThrow(() -> new RuntimeException("Document introuvable."));

        if (dossier.getStatut() != StatutDossier.VALIDE) {
            throw new RuntimeException("Ce document ne correspond pas a une admission validee.");
        }

        Universite universite = universiteRepo.findById(dossier.getUniversiteId())
            .orElseThrow(() -> new RuntimeException("Universite introuvable."));

        if (!universite.getCode().equalsIgnoreCase(universiteCode.trim())) {
            throw new RuntimeException("Le code universite ne correspond pas au document.");
        }

        Inscription inscription = trouverInscriptionPourDossierValide(dossier, universite)
            .orElseThrow(() -> new RuntimeException("Inscription associee introuvable."));

        if (inscription.getMatricule() == null || !inscription.getMatricule().equalsIgnoreCase(matricule.trim())) {
            throw new RuntimeException("Le matricule ne correspond pas au document verifie.");
        }

        Departement departement = departementRepo.findById(dossier.getDepartementId()).orElse(null);
        Filiere filiere = filiereRepo.findById(dossier.getFiliereId()).orElse(null);

        Map<String, Object> result = new HashMap<>();
        result.put("valide", true);
        result.put("numeroDossier", dossier.getNumeroDossier());
        result.put("matricule", inscription.getMatricule());
        result.put("etudiant", (readString(dossier.getPrenom(), "") + " " + readString(dossier.getNom(), "")).trim());
        result.put("universite", universite.getNom());
        result.put("universiteCode", universite.getCode());
        result.put("departement", departement != null ? departement.getNom() : "-");
        result.put("filiere", filiere != null ? filiere.getNom() : "-");
        result.put("niveau", dossier.getNiveauVise());
        result.put("anneeAcademique", inscription.getAnneeAcademique() != null ? inscription.getAnneeAcademique().getLibelle() : "-");
        result.put("dateVerification", LocalDateTime.now());
        return result;
    }

    private java.util.Optional<Inscription> trouverInscriptionPourDossierValide(DossierInscription dossier, Universite universite) {
        return inscriptionRepo.findByDossierInscriptionId(dossier.getId())
            .or(() -> inscriptionRepo.findByEmailAndUniversiteIdOrderByCreeLeDesc(dossier.getEmail(), universite.getId())
                .stream()
                .findFirst());
    }

    // ─── 9. Rejeter un dossier ──────────────────────────────────────

    @Transactional
    public DossierInscription rejeterDossier(Long dossierId, String motif) {
        DossierInscription dossier = obtenir(dossierId);

        if (dossier.getStatut() != StatutDossier.EN_ATTENTE) {
            throw new RuntimeException("Ce dossier n'est plus en attente");
        }

        dossier.setStatut(StatutDossier.REJETE);
        dossier.setMotifRejet(motif);
        return dossierRepo.save(dossier);
    }

    /** Marque les frais d'inscription comme payés (constat manuel secrétariat/caisse). */
    @Transactional
    public DossierInscription marquerFraisPayes(Long dossierId, String reference) {
        DossierInscription dossier = obtenir(dossierId);
        dossier.setFraisInscriptionPayes(true);
        dossier.setReferencePaiement(reference != null && !reference.isBlank() ? reference : "MANUEL");
        dossier.setDatePaiementInscription(LocalDateTime.now());
        attribuerAgent(dossier);   // transmission aux admissions
        return dossierRepo.save(dossier);
    }

    /**
     * Transmission aux admissions : dès que les frais de dossier sont payés, le
     * dossier est attribué automatiquement au secrétaire académique le moins
     * chargé de l'université (round-robin par charge). S'il n'y a aucun agent, le
     * dossier reste non attribué et sera traité par l'administration.
     */
    private void attribuerAgent(DossierInscription dossier) {
        if (dossier.getAgentAdmissionId() != null || dossier.getUniversiteId() == null) {
            return;
        }
        List<Utilisateur> agents = utilisateurRepo
            .findByRoleAndUniversiteId(RoleEnum.SECRETAIRE_ACADEMIQUE, dossier.getUniversiteId())
            .stream().filter(Utilisateur::isActif).toList();
        if (agents.isEmpty()) {
            return;
        }
        Utilisateur choisi = agents.stream()
            .min(java.util.Comparator.comparingLong(a -> dossierRepo.countByAgentAdmissionId(a.getId())))
            .orElse(agents.get(0));
        dossier.setAgentAdmissionId(choisi.getId());
        dossier.setAgentAdmissionNom(choisi.getNomComplet());
        dossier.setAttribueLe(LocalDateTime.now());
    }

    // ─── Test d'admission (candidat < 60% au diplôme d'État) ────────────

    /** Extrait le pourcentage du diplôme (ex: "65", "65%", "65,5") en nombre, ou null si illisible. */
    private Double parsePourcentage(String txt) {
        if (txt == null) return null;
        String nettoye = txt.replaceAll("[^0-9,.]", "").replace(',', '.');
        if (nettoye.isBlank()) return null;
        try { return Double.parseDouble(nettoye); } catch (Exception e) { return null; }
    }

    /**
     * True si le candidat doit passer le test d'admission : la filière l'exige
     * OU le diplôme est &lt; 60 % (règle historique conservée), et le test n'est
     * pas encore réussi.
     */
    public boolean testAdmissionRequis(DossierInscription d) {
        boolean exigeParFiliere = d.getFiliereId() != null
            && filiereRepo.findById(d.getFiliereId()).map(Filiere::isTestAdmissionRequis).orElse(false);
        return testAdmissionRequis(d, exigeParFiliere);
    }

    /** Surcharge interne : le drapeau de la filière est fourni (évite un rechargement en boucle). */
    private boolean testAdmissionRequis(DossierInscription d, boolean exigeParFiliere) {
        if (Boolean.TRUE.equals(d.getTestAdmissionReussi())) {
            return false;
        }
        if (exigeParFiliere) {
            return true;
        }
        Double p = parsePourcentage(d.getPourcentage());
        return p != null && p < 60.0;
    }

    /** Convoque le candidat (< 60%) au test d'admission et l'en informe par email. */
    @Transactional
    public DossierInscription convoquerTestAdmission(Long dossierId, String message) {
        DossierInscription dossier = obtenir(dossierId);
        dossier.setStatut(StatutDossier.TEST_ADMISSION);
        dossierRepo.save(dossier);
        Universite uni = universiteRepo.findById(dossier.getUniversiteId()).orElse(null);
        emailService.envoyerConvocationTest(dossier, uni, message);
        return dossier;
    }

    /**
     * Vérification du code EXETAT par l'agent d'admissions : le code a été contrôlé
     * sur la plateforme officielle. Débloque la validation pour un diplôme >= 2022.
     */
    @Transactional
    public DossierInscription verifierExetat(Long dossierId, String agentNom) {
        DossierInscription dossier = obtenir(dossierId);
        if (dossier.getCodeExetat() == null || dossier.getCodeExetat().isBlank()) {
            throw new RuntimeException("Aucun code EXETAT n'est renseigné sur ce dossier.");
        }
        dossier.setExetatVerifie(true);
        dossier.setExetatVerifieLe(LocalDateTime.now());
        dossier.setExetatVerifiePar(agentNom != null ? agentNom : "Agent d'admissions");
        return dossierRepo.save(dossier);
    }

    /** Marque le test d'admission réussi → le dossier redevient validable. */
    @Transactional
    public DossierInscription marquerTestReussi(Long dossierId) {
        DossierInscription dossier = obtenir(dossierId);
        dossier.setTestAdmissionReussi(true);
        if (dossier.getStatut() == StatutDossier.TEST_ADMISSION) {
            dossier.setStatut(StatutDossier.EN_ATTENTE);
        }
        return dossierRepo.save(dossier);
    }

    /** Le secrétariat envoie un message d'information libre au candidat (email). */
    public void envoyerMessageAuCandidat(Long dossierId, String sujet, String message) {
        DossierInscription dossier = obtenir(dossierId);
        Universite uni = universiteRepo.findById(dossier.getUniversiteId()).orElse(null);
        emailService.envoyerMessageSecretariat(dossier.getEmail(),
            dossier.getPrenom() + " " + dossier.getNom(), sujet, message, uni);
    }

    /** Renvoie l'email d'activation (nouveau lien 48h) + la lettre d'admission à un candidat déjà validé. */
    @Transactional
    public Map<String, Object> renvoyerActivation(Long dossierId) {
        DossierInscription dossier = obtenir(dossierId);
        if (dossier.getStatut() != StatutDossier.VALIDE) {
            throw new RuntimeException("Le dossier doit être validé pour renvoyer l'activation.");
        }
        Universite uni = universiteRepo.findById(dossier.getUniversiteId())
            .orElseThrow(() -> new RuntimeException("Université introuvable"));
        Departement dept = departementRepo.findById(dossier.getDepartementId()).orElse(null);
        Filiere filiere = filiereRepo.findById(dossier.getFiliereId()).orElse(null);
        AnneeAcademique annee = getAnneeCourante(uni);
        Inscription inscription = trouverInscriptionPourDossierValide(dossier, uni).orElse(null);
        String matricule = java.util.Optional.ofNullable(inscription)
            .map(Inscription::getMatricule)
            .orElse("EN-ATTENTE");
        Utilisateur utilisateur = assurerCompteEtudiantPourDossierValide(dossier, uni, dept, inscription);

        boolean dejaActive = utilisateur.isCompteActive();
        if (!dejaActive) {
            String token = UUID.randomUUID().toString();
            utilisateur.setTokenActivation(token);
            utilisateur.setTokenExpiration(LocalDateTime.now().plusHours(48));
            utilisateurRepo.save(utilisateur);
            try { emailService.envoyerEmailActivation(utilisateur, token, matricule); }
            catch (Exception e) { log.warn("Renvoi activation non envoyé à {} : {}", dossier.getEmail(), e.getMessage()); }
        }

        long seq = inscriptionRepo.countByUniversite_IdAndAnneeAcademique_Id(uni.getId(), annee.getId());
        String numeroLettre = String.format("%s/ADM/%d/%05d", uni.getCode().toUpperCase(),
            LocalDate.now().getYear(), seq);
        emailService.envoyerLettreAcceptation(dossier, uni, dept, filiere,
            matricule, annee.getLibelle(), null, numeroLettre);

        return Map.of(
            "message", dejaActive
                ? "Compte déjà activé : lettre d'admission renvoyée par email."
                : "Email d'activation (nouveau lien valable 48h) et lettre d'admission renvoyés à " + dossier.getEmail() + ".",
            "email", dossier.getEmail(),
            "compteActive", dejaActive
        );
    }

    /** Infos de paiement d'un dossier (page publique de paiement par n° de dossier). */
    public Map<String, Object> getPaiementInfo(String numeroDossier) {
        DossierInscription d = getDossierByNumero(numeroDossier);
        LocalDateTime expiration = getPaymentLinkExpiration(d);
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("numeroDossier", d.getNumeroDossier());
        m.put("nom", d.getNom());
        m.put("prenom", d.getPrenom());
        m.put("email", d.getEmail());
        m.put("niveauVise", d.getNiveauVise());
        m.put("montant", d.getMontantInscription());
        m.put("devise", d.getDeviseInscription() != null ? d.getDeviseInscription() : "USD");
        m.put("paye", Boolean.TRUE.equals(d.getFraisInscriptionPayes()));
        m.put("statut", d.getStatut());
        m.put("paymentLink", buildPaymentLink(d));
        m.put("paymentExpiresAt", expiration);
        m.put("paymentExpired", isPaymentLinkExpired(d));
        return m;
    }

    public Map<String, Object> getTachPayCheckoutContext(String numeroDossier) {
        DossierInscription d = getDossierByNumero(numeroDossier);
        Universite universite = d.getUniversiteId() != null
            ? universiteRepo.findById(d.getUniversiteId()).orElse(null)
            : null;
        Departement departement = d.getDepartementId() != null
            ? departementRepo.findById(d.getDepartementId()).orElse(null)
            : null;
        Filiere filiere = d.getFiliereId() != null
            ? filiereRepo.findById(d.getFiliereId()).orElse(null)
            : null;

        Map<String, Object> detail = new java.util.LinkedHashMap<>();
        detail.put("dossierMode", true);
        detail.put("numeroDossier", d.getNumeroDossier());
        detail.put("nom", d.getNom());
        detail.put("prenom", d.getPrenom());
        detail.put("email", d.getEmail());
        detail.put("telephone", d.getTelephone());
        detail.put("niveau", d.getNiveauVise());
        detail.put("universiteNom", universite != null ? universite.getNom() : "");
        detail.put("universiteId", universite != null ? universite.getId() : null);
        detail.put("faculteNom", departement != null ? departement.getNom() : "");
        detail.put("departementId", departement != null ? departement.getId() : null);
        detail.put("filiereNom", filiere != null ? filiere.getNom() : "");
        detail.put("filiereId", filiere != null ? filiere.getId() : null);
        detail.put("paymentExpiresAt", getPaymentLinkExpiration(d));
        detail.put("paymentExpired", isPaymentLinkExpired(d));

        List<Map<String, Object>> frais = new java.util.ArrayList<>();
        Map<String, Object> fraisInscription = new java.util.LinkedHashMap<>();
        fraisInscription.put("id", 1L);
        fraisInscription.put("code", "INSCRIPTION-DOSSIER");
        fraisInscription.put("libelle", "Frais d'inscription du dossier " + d.getNumeroDossier());
        fraisInscription.put("montant", d.getMontantInscription() != null ? d.getMontantInscription() : 0.0);
        fraisInscription.put("reste", d.getMontantInscription() != null ? d.getMontantInscription() : 0.0);
        fraisInscription.put("paye", Boolean.TRUE.equals(d.getFraisInscriptionPayes()) ? (d.getMontantInscription() != null ? d.getMontantInscription() : 0.0) : 0.0);
        fraisInscription.put("statut", Boolean.TRUE.equals(d.getFraisInscriptionPayes()) ? "PAYE" : "EN_ATTENTE");
        fraisInscription.put("type", "INSCRIPTION");
        frais.add(fraisInscription);

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("data", detail);
        result.put("frais", frais);
        result.put("numeroDossier", d.getNumeroDossier());
        result.put("paymentExpiresAt", getPaymentLinkExpiration(d));
        result.put("paymentExpired", isPaymentLinkExpired(d));
        return result;
    }

    // ─── Paiement RÉEL des frais d'inscription (initiation → webhook) ──
    // Le dossier n'est JAMAIS marqué payé à l'initiation : une
    // TransactionDossier est créée en PENDING, l'opérateur est réellement
    // appelé, et seul le webhook signé (TachPayWebhookService →
    // confirmerPaiementFraisDossier) marque le dossier payé.
    // Même mécanique que le flux TachPay des frais académiques.

    /** Initie un paiement Mobile Money des frais d'inscription d'un dossier. */
    @Transactional
    public Map<String, Object> initierPaiementFraisInscription(String numeroDossier,
                                                               String operateur,
                                                               String telephone) {
        DossierInscription d = getDossierByNumero(numeroDossier);
        validerDossierPayable(d);
        double montant = d.getMontantInscription();
        String devise = d.getDeviseInscription() != null ? d.getDeviseInscription() : "USD";
        String reference = genererReferencePaiementDossier(numeroDossier);

        String externalId;
        try {
            externalId = mobileMoneyService.initierChargeOperateur(operateur, telephone, montant, reference);
        } catch (Exception e) {
            transactionDossierRepo.save(cd.genuc.model.TransactionDossier.builder()
                .numeroDossier(d.getNumeroDossier())
                .reference(reference)
                .provider(operateur.toUpperCase())
                .externalId("ERROR")
                .telephone(telephone)
                .montant(montant)
                .devise(devise)
                .status("FAILED")
                .rawResponse(e.getMessage())
                .build());
            throw new RuntimeException("Échec de l'initiation du paiement " + operateur + " : " + e.getMessage());
        }

        transactionDossierRepo.save(cd.genuc.model.TransactionDossier.builder()
            .numeroDossier(d.getNumeroDossier())
            .reference(reference)
            .provider(operateur.toUpperCase())
            .externalId(externalId)
            .telephone(telephone)
            .montant(montant)
            .devise(devise)
            .status("PENDING")
            .build());

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("reference", reference);
        result.put("numeroDossier", d.getNumeroDossier());
        result.put("montant", montant);
        result.put("devise", devise);
        result.put("operateur", operateur.toUpperCase());
        result.put("externalId", externalId);
        result.put("status", "PENDING");
        result.put("message", "Paiement initié. Confirmez sur votre téléphone.");
        return result;
    }

    /** Initie un paiement carte (Stripe Checkout) des frais d'inscription d'un dossier. */
    @Transactional
    public Map<String, Object> initierPaiementFraisInscriptionParCarte(String numeroDossier,
                                                                       String successUrl,
                                                                       String cancelUrl) {
        DossierInscription d = getDossierByNumero(numeroDossier);
        validerDossierPayable(d);
        double montant = d.getMontantInscription();
        String devise = d.getDeviseInscription() != null ? d.getDeviseInscription() : "USD";
        String reference = genererReferencePaiementDossier(numeroDossier);

        cd.genuc.service.tachpay.StripeService.StripeSession session = stripeService.creerSessionCheckout(
            montant, devise, successUrl, cancelUrl, "Frais d'inscription — dossier " + numeroDossier);

        transactionDossierRepo.save(cd.genuc.model.TransactionDossier.builder()
            .numeroDossier(d.getNumeroDossier())
            .reference(reference)
            .provider("STRIPE")
            .externalId(session.id())
            .montant(montant)
            .devise(devise)
            .status("PENDING")
            .build());

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("reference", reference);
        result.put("numeroDossier", d.getNumeroDossier());
        result.put("montant", montant);
        result.put("devise", devise);
        result.put("sessionId", session.id());
        // URL hébergée Stripe : c'est ici que la carte est réellement saisie
        result.put("checkoutUrl", session.url());
        result.put("status", "PENDING");
        result.put("message", "Session de paiement carte créée.");
        return result;
    }

    /**
     * Confirmation par WEBHOOK opérateur (seul chemin qui marque le dossier payé).
     * Idempotent : une transaction déjà terminale n'est jamais rejouée.
     */
    @Transactional
    public Map<String, Object> confirmerPaiementFraisDossier(String provider,
                                                             String externalId,
                                                             String status,
                                                             String message) {
        cd.genuc.model.TransactionDossier tx = transactionDossierRepo
            .findByProviderAndExternalId(provider, externalId)
            .orElseThrow(() -> new RuntimeException(
                "Transaction dossier non trouvée : " + provider + "/" + externalId));

        if (tx.estTerminale()) {
            log.info("Webhook {} ignoré : transaction dossier {} déjà dans l'état terminal {}.",
                provider, externalId, tx.getStatus());
            return Map.of("received", true, "ignored", true, "status", tx.getStatus());
        }

        tx.setStatus(status);
        if (message != null) {
            tx.setRawResponse(message);
        }
        transactionDossierRepo.save(tx);

        if ("SUCCESS".equalsIgnoreCase(status)) {
            DossierInscription d = getDossierByNumero(tx.getNumeroDossier());
            if (!Boolean.TRUE.equals(d.getFraisInscriptionPayes())) {
                d.setFraisInscriptionPayes(true);
                d.setReferencePaiement(tx.getReference());
                d.setDatePaiementInscription(LocalDateTime.now());
                d.setModePaiement("STRIPE".equalsIgnoreCase(provider) ? "CARTE_BANCAIRE" : "MOBILE_MONEY");
                d.setNumeroTransaction(externalId);
                attribuerAgent(d);   // transmission automatique aux admissions
                dossierRepo.save(d);
                log.info("Frais d'inscription du dossier {} confirmés par webhook {} (ref {}).",
                    d.getNumeroDossier(), provider, tx.getReference());
            }
        } else {
            log.warn("Paiement des frais de dossier {} échoué ({}) : {}",
                tx.getNumeroDossier(), provider, message);
        }

        return Map.of("received", true, "status", status, "numeroDossier", tx.getNumeroDossier());
    }

    /** Statut d'une transaction de frais de dossier (polling public du frontend). */
    @Transactional(readOnly = true)
    public Map<String, Object> getStatutPaiementDossier(String reference) {
        cd.genuc.model.TransactionDossier tx = transactionDossierRepo.findByReference(reference)
            .orElseThrow(() -> new RuntimeException("Transaction introuvable : " + reference));
        DossierInscription d = getDossierByNumero(tx.getNumeroDossier());

        // Vocabulaire aligné sur le polling existant (PaiementStatutPoller) :
        // VALIDE / REJETE / EN_ATTENTE.
        String statut = switch (tx.getStatus().toUpperCase()) {
            case "SUCCESS" -> "VALIDE";
            case "FAILED" -> "REJETE";
            default -> "EN_ATTENTE";
        };

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("reference", reference);
        result.put("statut", statut);
        result.put("paye", Boolean.TRUE.equals(d.getFraisInscriptionPayes()));
        result.put("numeroDossier", tx.getNumeroDossier());
        result.put("montant", tx.getMontant());
        result.put("devise", tx.getDevise());
        result.put("operateur", tx.getProvider());
        if ("REJETE".equals(statut)) {
            result.put("motifRejet", "Paiement refusé ou échoué chez l'opérateur.");
        }
        return result;
    }

    private void validerDossierPayable(DossierInscription d) {
        if (Boolean.TRUE.equals(d.getFraisInscriptionPayes())) {
            throw new RuntimeException("Les frais d'inscription de ce dossier sont déjà réglés.");
        }
        if (isPaymentLinkExpired(d)) {
            throw new RuntimeException("Le lien de paiement associe a ce dossier a expire apres 72h.");
        }
        if (d.getMontantInscription() == null || d.getMontantInscription() <= 0) {
            throw new RuntimeException("Aucun montant de frais d'inscription n'est défini pour ce dossier.");
        }
    }

    private String genererReferencePaiementDossier(String numeroDossier) {
        // Le numéro contient déjà le marqueur DOS : ne pas le re-préfixer.
        return numeroDossier + "-" + System.currentTimeMillis();
    }

    private void notifierAccuseReception(DossierInscription dossier) {
        Universite universite = dossier.getUniversiteId() != null
            ? universiteRepo.findById(dossier.getUniversiteId()).orElse(null)
            : null;
        emailService.envoyerAccuseReceptionDossier(
            dossier,
            universite,
            buildPaymentLink(dossier),
            getPaymentLinkExpiration(dossier)
        );
    }

    private String buildPaymentLink(DossierInscription dossier) {
        return appBaseUrl + "/paiement-tachpay?dossier=" + dossier.getNumeroDossier();
    }

    private LocalDateTime getPaymentLinkExpiration(DossierInscription dossier) {
        return dossier.getCreeLe() != null ? dossier.getCreeLe().plusHours(72) : null;
    }

    private boolean isPaymentLinkExpired(DossierInscription dossier) {
        if (Boolean.TRUE.equals(dossier.getFraisInscriptionPayes())) {
            return false;
        }
        LocalDateTime expiration = getPaymentLinkExpiration(dossier);
        return expiration != null && LocalDateTime.now().isAfter(expiration);
    }

    // ─── 9. Mettre à jour un dossier en attente ─────────────────────

    @Transactional
    public DossierInscription updateDossier(Long id, InscriptionPubliqueRequest request) {
        DossierInscription dossier = obtenir(id);

        if (dossier.getStatut() != StatutDossier.EN_ATTENTE) {
            throw new RuntimeException("Impossible de modifier un dossier qui n'est plus en attente.");
        }

        dossier.setNom(request.getNom().toUpperCase());
        dossier.setPrenom(request.getPrenom());
        dossier.setEmail(request.getEmail().toLowerCase().trim());
        dossier.setTelephone(request.getTelephone1());
        dossier.setSexe(request.getSexe());
        dossier.setLieuNaissance(request.getLieuNaissance());
        dossier.setDateNaissance(request.getDateNaissance());
        dossier.setAdresse(buildAdresse(request));
        dossier.setNiveauVise(request.getNiveauVise());
        dossier.setUniversiteId(request.getUniversiteId());
        dossier.setDepartementId(request.getDepartementId());
        dossier.setFiliereId(request.getFiliereId());
        dossier.setEcoleSecondaire(request.getEcoleSecondaire());
        dossier.setProvinceEcole(request.getProvinceEcole());
        dossier.setAnneeObtention(request.getAnneeObtention());
        dossier.setNumeroDiplome(request.getNumeroDiplome());
        dossier.setPourcentage(request.getPourcentage());
        dossier.setOption(request.getOption());
        dossier.setPereNom(request.getPereNom());
        dossier.setPereProfession(request.getPereProfession());
        dossier.setPereTelephone(request.getPereTelephone());
        dossier.setMereNom(request.getMereNom());
        dossier.setMereProfession(request.getMereProfession());
        dossier.setMereTelephone(request.getMereTelephone());
        dossier.setTuteurNom(request.getTuteurNom());
        dossier.setTuteurLien(request.getTuteurLien());
        dossier.setTuteurTelephone(request.getTuteurTelephone());
        dossier.setTuteurAdresse(request.getTuteurAdresse());
        dossier.setUrgenceNom(request.getUrgenceNom());
        dossier.setUrgenceTelephone(request.getUrgenceTelephone());
        dossier.setAllergies(request.getAllergies());
        dossier.setHandicap(request.getHandicap());
        dossier.setModePaiement(request.getModePaiement());
        dossier.setNumeroTransaction(request.getNumeroTransaction());
        dossier.setBourse(request.getBourse() != null && request.getBourse());
        dossier.setMontantPaye(request.getMontantPaye() != null ? request.getMontantPaye() : 0.0);

        return dossierRepo.save(dossier);
    }

    @Transactional
    public DossierInscription corrigerDossierParAdministration(Long dossierId, Map<String, Object> body) {
        DossierInscription dossier = obtenir(dossierId);
        String ancienEmail = dossier.getEmail();

        appliquerCorrectionsDossier(dossier, body);
        dossier = dossierRepo.save(dossier);
        synchroniserCompteRestreint(dossier, ancienEmail);

        if (dossier.getStatut() == StatutDossier.VALIDE) {
            synchroniserInscriptionValidee(dossier, body, ancienEmail);
        }

        return dossier;
    }

    // ─── 10. Annuler un dossier ──────────────────────────────────────

    @Transactional
    public DossierInscription annulerDossier(Long id) {
        return annulerDossier(id, "Annulation par l'utilisateur");
    }

    @Transactional
    public DossierInscription annulerDossier(Long id, String motif) {
        DossierInscription dossier = obtenir(id);

        if (dossier.getStatut() != StatutDossier.EN_ATTENTE) {
            throw new RuntimeException("Seul un dossier en attente peut être annulé.");
        }

        dossier.setStatut(StatutDossier.REJETE);
        dossier.setMotifRejet(motif != null ? motif : "Annulation par l'utilisateur");

        return dossierRepo.save(dossier);
    }

    private void appliquerCorrectionsDossier(DossierInscription dossier, Map<String, Object> body) {
        if (body == null || body.isEmpty()) {
            throw new RuntimeException("Aucune correction fournie.");
        }

        String nouvelEmail = readString(body.get("email"), dossier.getEmail());
        verifierDisponibiliteEmail(nouvelEmail, dossier.getEmail(), dossier.getId());

        Long universiteId = readLong(body.get("universiteId"), dossier.getUniversiteId());
        Long departementId = readLong(body.get("departementId"), dossier.getDepartementId());
        Long filiereId = readLong(body.get("filiereId"), dossier.getFiliereId());

        if (universiteId != null && departementId != null && filiereId != null) {
            validerParcoursAcademique(universiteId, departementId, filiereId);
        }

        dossier.setNom(readString(body.get("nom"), dossier.getNom()).toUpperCase());
        dossier.setPrenom(readString(body.get("prenom"), dossier.getPrenom()));
        dossier.setEmail(nouvelEmail.toLowerCase().trim());
        dossier.setTelephone(readString(body.get("telephone"), dossier.getTelephone()));
        dossier.setTelephone2(readString(body.get("telephone2"), dossier.getTelephone2()));
        dossier.setSexe(readString(body.get("sexe"), dossier.getSexe()));
        dossier.setLieuNaissance(readString(body.get("lieuNaissance"), dossier.getLieuNaissance()));
        dossier.setDateNaissance(readLocalDate(body.get("dateNaissance"), dossier.getDateNaissance()));
        dossier.setAdresse(readString(body.get("adresse"), dossier.getAdresse()));
        dossier.setNationalite(readString(body.get("nationalite"), dossier.getNationalite()));
        dossier.setEtatCivil(readString(body.get("etatCivil"), dossier.getEtatCivil()));
        dossier.setProvince(readString(body.get("province"), dossier.getProvince()));
        dossier.setVille(readString(body.get("ville"), dossier.getVille()));
        dossier.setCommune(readString(body.get("commune"), dossier.getCommune()));
        dossier.setQuartier(readString(body.get("quartier"), dossier.getQuartier()));
        dossier.setAvenue(readString(body.get("avenue"), dossier.getAvenue()));
        dossier.setNumeroResidence(readString(body.get("numeroResidence"), dossier.getNumeroResidence()));
        dossier.setUniversiteId(universiteId);
        dossier.setDepartementId(departementId);
        dossier.setFiliereId(filiereId);
        dossier.setNiveauVise(readString(body.get("niveauVise"), dossier.getNiveauVise()));
        dossier.setTypeInscription(readString(body.get("typeInscription"), dossier.getTypeInscription()));
        dossier.setEcoleSecondaire(readString(body.get("ecoleSecondaire"), dossier.getEcoleSecondaire()));
        dossier.setProvinceEcole(readString(body.get("provinceEcole"), dossier.getProvinceEcole()));
        dossier.setAnneeObtention(readString(body.get("anneeObtention"), dossier.getAnneeObtention()));
        dossier.setNumeroDiplome(readString(body.get("numeroDiplome"), dossier.getNumeroDiplome()));
        dossier.setPourcentage(readString(body.get("pourcentage"), dossier.getPourcentage()));
        dossier.setOption(readString(body.get("option"), dossier.getOption()));
        dossier.setPereNom(readString(body.get("pereNom"), dossier.getPereNom()));
        dossier.setPereProfession(readString(body.get("pereProfession"), dossier.getPereProfession()));
        dossier.setPereTelephone(readString(body.get("pereTelephone"), dossier.getPereTelephone()));
        dossier.setMereNom(readString(body.get("mereNom"), dossier.getMereNom()));
        dossier.setMereProfession(readString(body.get("mereProfession"), dossier.getMereProfession()));
        dossier.setMereTelephone(readString(body.get("mereTelephone"), dossier.getMereTelephone()));
        dossier.setTuteurNom(readString(body.get("tuteurNom"), dossier.getTuteurNom()));
        dossier.setTuteurLien(readString(body.get("tuteurLien"), dossier.getTuteurLien()));
        dossier.setTuteurTelephone(readString(body.get("tuteurTelephone"), dossier.getTuteurTelephone()));
        dossier.setTuteurAdresse(readString(body.get("tuteurAdresse"), dossier.getTuteurAdresse()));
        dossier.setUrgenceNom(readString(body.get("urgenceNom"), dossier.getUrgenceNom()));
        dossier.setUrgenceTelephone(readString(body.get("urgenceTelephone"), dossier.getUrgenceTelephone()));
        dossier.setAllergies(readString(body.get("allergies"), dossier.getAllergies()));
        dossier.setHandicap(readString(body.get("handicap"), dossier.getHandicap()));
        dossier.setCommentaire(readString(body.get("commentaire"), dossier.getCommentaire()));
    }

    private void synchroniserCompteRestreint(DossierInscription dossier, String ancienEmail) {
        Utilisateur utilisateur = utilisateurRepo.findByEmail(ancienEmail).orElse(null);
        if (utilisateur == null || utilisateur.getRole() != RoleEnum.ETUDIANT) {
            return;
        }
        utilisateur.setNom(dossier.getNom());
        utilisateur.setPrenom(dossier.getPrenom());
        utilisateur.setEmail(dossier.getEmail());
        utilisateur.setTelephone(dossier.getTelephone());
        utilisateur.setUniversiteId(dossier.getUniversiteId());
        utilisateur.setDepartementId(dossier.getDepartementId());
        utilisateurRepo.save(utilisateur);
    }

    private Utilisateur assurerCompteEtudiantPourDossierValide(DossierInscription dossier,
                                                               Universite universite,
                                                               Departement departement,
                                                               Inscription inscription) {
        Utilisateur utilisateur = inscription != null
            ? utilisateurRepo.findByInscriptionId(inscription.getId()).orElse(null)
            : null;
        if (utilisateur == null) {
            utilisateur = utilisateurRepo.findByEmail(dossier.getEmail()).orElse(null);
        }

        if (utilisateur == null) {
            utilisateur = Utilisateur.builder()
                .nom(dossier.getNom())
                .prenom(dossier.getPrenom())
                .email(dossier.getEmail())
                .motDePasse(passwordEncoder.encode(UUID.randomUUID().toString()))
                .telephone(dossier.getTelephone())
                .role(RoleEnum.ETUDIANT)
                .universiteId(universite.getId())
                .departementId(departement.getId())
                .inscriptionId(inscription != null ? inscription.getId() : null)
                .compteActive(false)
                .actif(true)
                .build();
            return utilisateurRepo.save(utilisateur);
        }

        if (utilisateur.getRole() != RoleEnum.ETUDIANT) {
            throw new RuntimeException("Le compte lié à ce dossier n'est pas un compte étudiant.");
        }

        utilisateur.setNom(dossier.getNom());
        utilisateur.setPrenom(dossier.getPrenom());
        utilisateur.setEmail(dossier.getEmail());
        utilisateur.setTelephone(dossier.getTelephone());
        utilisateur.setUniversiteId(universite.getId());
        utilisateur.setDepartementId(departement.getId());
        if (inscription != null) {
            utilisateur.setInscriptionId(inscription.getId());
        }
        return utilisateurRepo.save(utilisateur);
    }

    private void synchroniserInscriptionValidee(DossierInscription dossier, Map<String, Object> body, String ancienEmail) {
        Inscription inscription = inscriptionRepo.findByDossierInscriptionId(dossier.getId())
            .orElseGet(() -> inscriptionRepo.findByEmailAndUniversiteIdOrderByCreeLeDesc(ancienEmail, dossier.getUniversiteId())
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Inscription liée introuvable pour ce dossier validé.")));

        Universite universite = universiteRepo.findById(dossier.getUniversiteId())
            .orElseThrow(() -> new RuntimeException("Université introuvable"));
        Departement departement = departementRepo.findById(dossier.getDepartementId())
            .orElseThrow(() -> new RuntimeException("Département introuvable"));
        Filiere filiere = filiereRepo.findById(dossier.getFiliereId())
            .orElseThrow(() -> new RuntimeException("Filière introuvable"));
        Promotion promotion = resoudrePromotion(filiere.getId(), readLong(body.get("promotionId"), null), dossier.getNiveauVise());

        inscription.setDossierInscriptionId(dossier.getId());
        inscription.setNom(dossier.getNom());
        inscription.setPrenom(dossier.getPrenom());
        inscription.setEmail(dossier.getEmail());
        inscription.setTelephone(dossier.getTelephone());
        inscription.setSexe(dossier.getSexe());
        inscription.setLieuNaissance(dossier.getLieuNaissance());
        inscription.setDateNaissance(dossier.getDateNaissance());
        inscription.setAdresse(dossier.getAdresse());
        inscription.setNiveau(dossier.getNiveauVise());
        inscription.setUniversite(universite);
        inscription.setDepartement(departement);
        inscription.setFiliere(filiere);
        inscription.setPromotion(promotion);
        inscriptionRepo.save(inscription);

        Etudiant etudiant = inscription.getEtudiant();
        etudiant.setNom(dossier.getNom());
        etudiant.setPrenom(dossier.getPrenom());
        etudiant.setEmail(dossier.getEmail());
        etudiant.setTelephone(dossier.getTelephone());
        etudiant.setSexe(dossier.getSexe());
        etudiant.setLieuNaissance(dossier.getLieuNaissance());
        etudiant.setDateNaissance(dossier.getDateNaissance());
        etudiant.setAdresse(dossier.getAdresse());
        etudiantRepo.save(etudiant);

        Utilisateur utilisateur = utilisateurRepo.findByInscriptionId(inscription.getId())
            .orElseGet(() -> utilisateurRepo.findByEmail(ancienEmail).orElse(null));
        if (utilisateur != null) {
            utilisateur.setNom(dossier.getNom());
            utilisateur.setPrenom(dossier.getPrenom());
            utilisateur.setEmail(dossier.getEmail());
            utilisateur.setTelephone(dossier.getTelephone());
            utilisateur.setUniversiteId(universite.getId());
            utilisateur.setDepartementId(departement.getId());
            utilisateur.setInscriptionId(inscription.getId());
            utilisateurRepo.save(utilisateur);
        }
    }

    private Promotion resoudrePromotion(Long filiereId, Long promotionId, String niveauVise) {
        if (promotionId != null) {
            Promotion promotion = promotionRepo.findById(promotionId)
                .orElseThrow(() -> new RuntimeException("Promotion introuvable"));
            if (!Objects.equals(promotion.getFiliere().getId(), filiereId)) {
                throw new RuntimeException("La promotion sélectionnée n'appartient pas à la filière choisie.");
            }
            return promotion;
        }

        return promotionRepo.findByFiliereId(filiereId).stream()
            .filter(p -> p.getLibelle() != null && p.getLibelle().equalsIgnoreCase(niveauVise))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Aucune promotion ne correspond au niveau sélectionné pour cette filière."));
    }

    private void verifierDisponibiliteEmail(String nouvelEmail, String ancienEmail, Long dossierId) {
        if (nouvelEmail == null || nouvelEmail.isBlank() || nouvelEmail.equalsIgnoreCase(ancienEmail)) {
            return;
        }

        dossierRepo.findByEmail(nouvelEmail)
            .filter(d -> !Objects.equals(d.getId(), dossierId))
            .ifPresent(d -> { throw new RuntimeException("Un autre dossier utilise déjà cet email."); });

        utilisateurRepo.findByEmail(nouvelEmail)
            .filter(u -> !nouvelEmail.equalsIgnoreCase(ancienEmail))
            .ifPresent(u -> { throw new RuntimeException("Un compte utilisateur utilise déjà cet email."); });

        etudiantRepo.findByEmail(nouvelEmail)
            .filter(e -> ancienEmail == null || !nouvelEmail.equalsIgnoreCase(ancienEmail))
            .ifPresent(e -> { throw new RuntimeException("Un étudiant utilise déjà cet email."); });
    }

    private void validerParcoursAcademique(Long universiteId, Long departementId, Long filiereId) {
        Universite universite = universiteRepo.findById(universiteId)
            .orElseThrow(() -> new RuntimeException("Université introuvable"));
        Departement departement = departementRepo.findById(departementId)
            .orElseThrow(() -> new RuntimeException("Département introuvable"));
        Filiere filiere = filiereRepo.findById(filiereId)
            .orElseThrow(() -> new RuntimeException("Filière introuvable"));

        if (!Objects.equals(departement.getUniversite().getId(), universite.getId())) {
            throw new RuntimeException("Le département sélectionné n'appartient pas à cette université.");
        }
        if (!Objects.equals(filiere.getDepartement().getId(), departement.getId())) {
            throw new RuntimeException("La filière sélectionnée n'appartient pas à ce département.");
        }
    }

    private String readString(Object value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? fallback : text;
    }

    private Long readLong(Object value, Long fallback) {
        if (value == null) {
            return fallback;
        }
        String text = value.toString().trim();
        if (text.isEmpty()) {
            return fallback;
        }
        return Long.valueOf(text);
    }

    private LocalDate readLocalDate(Object value, LocalDate fallback) {
        if (value == null) {
            return fallback;
        }
        String text = value.toString().trim();
        if (text.isEmpty()) {
            return fallback;
        }
        return LocalDate.parse(text);
    }

    // ─── Demande de documents complémentaires + portail restreint étudiant ───

    @Transactional
    public DossierInscription demanderDocuments(Long dossierId, List<String> documents, String message) {
        DossierInscription dossier = obtenir(dossierId);
        if (dossier.getStatut() != StatutDossier.EN_ATTENTE) {
            throw new RuntimeException("Seul un dossier en attente peut faire l'objet d'une demande de documents.");
        }
        dossier.setStatut(StatutDossier.DOCUMENTS_MANQUANTS);
        dossier.setDocumentsDemandes(documents != null ? String.join(",", documents) : null);
        dossier.setMessageSecretaire(message);
        dossierRepo.save(dossier);

        // Crée (ou réactive) le compte étudiant restreint avec un lien d'activation.
        Utilisateur compte = utilisateurRepo.findByEmail(dossier.getEmail()).orElse(null);
        String token = UUID.randomUUID().toString();
        if (compte == null) {
            compte = Utilisateur.builder()
                .nom(dossier.getNom())
                .prenom(dossier.getPrenom())
                .email(dossier.getEmail())
                // Mot de passe provisoire (non-null : contrainte DB) ; remplacé par le vrai à l'activation.
                .motDePasse(passwordEncoder.encode(UUID.randomUUID().toString()))
                .telephone(dossier.getTelephone())
                .role(RoleEnum.ETUDIANT)
                .universiteId(dossier.getUniversiteId())
                .departementId(dossier.getDepartementId())
                .compteActive(false)
                .tokenActivation(token)
                .tokenExpiration(LocalDateTime.now().plusHours(72))
                .actif(true)
                .build();
            utilisateurRepo.save(compte);
            envoyerActivation(compte, token);
        } else if (!compte.isCompteActive()) {
            compte.setTokenActivation(token);
            compte.setTokenExpiration(LocalDateTime.now().plusHours(72));
            utilisateurRepo.save(compte);
            envoyerActivation(compte, token);
        }
        return dossier;
    }

    /** Dossier de l'étudiant connecté (recherché par son email de compte). */
    public DossierInscription getMonDossierParEmail(String email) {
        return dossierRepo.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Aucun dossier d'inscription trouvé pour votre compte."));
    }

    /** L'étudiant téléverse les documents demandés → le dossier repart en revue (EN_ATTENTE). */
    @Transactional
    public DossierInscription ajouterDocuments(String email, Map<String, MultipartFile> fichiers) {
        DossierInscription dossier = dossierRepo.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Aucun dossier d'inscription trouvé pour votre compte."));
        if (dossier.getStatut() != StatutDossier.DOCUMENTS_MANQUANTS) {
            throw new RuntimeException("Aucune demande de documents en cours pour votre dossier.");
        }
        if (fichiers != null) {
            appliquerFichier(fichiers.get("urlPhoto"), dossier::setUrlPhoto);
            appliquerFichier(fichiers.get("urlPhotoPasseport"), dossier::setUrlPhotoPasseport);
            appliquerFichier(fichiers.get("urlDiplomeEtat"), dossier::setUrlDiplomeEtat);
            appliquerFichier(fichiers.get("urlAttestationReussite"), dossier::setUrlAttestationReussite);
            appliquerFichier(fichiers.get("urlReleveNotes"), dossier::setUrlReleveNotes);
            appliquerFichier(fichiers.get("urlActeNaissance"), dossier::setUrlActeNaissance);
            appliquerFichier(fichiers.get("urlAttestationNationalite"), dossier::setUrlAttestationNationalite);
            appliquerFichier(fichiers.get("urlCarteIdentite"), dossier::setUrlCarteIdentite);
            appliquerFichier(fichiers.get("urlLettreRecommandation"), dossier::setUrlLettreRecommandation);
            appliquerFichier(fichiers.get("urlAttestationPhysique"), dossier::setUrlAttestationPhysique);
            appliquerFichier(fichiers.get("urlAttestationConduite"), dossier::setUrlAttestationConduite);
        }
        dossier.setStatut(StatutDossier.EN_ATTENTE);
        return dossierRepo.save(dossier);
    }

    private void appliquerFichier(MultipartFile file, java.util.function.Consumer<String> setter) {
        String url = enregistrerFichier(file);
        if (url != null) setter.accept(url);
    }

    private void envoyerActivation(Utilisateur compte, String token) {
        try {
            emailService.envoyerEmailActivation(compte, token, "");
        } catch (Exception e) {
            log.warn("Email d'activation non envoyé à {} : {}", compte.getEmail(), e.getMessage());
        }
    }

    // ─── Méthodes privées ──────────────────────────────────────────

    /**
     * Enregistre une pièce jointe de dossier d'inscription et renvoie son URL (ou null si vide).
     *
     * <p>Ces fichiers (bulletin, acte de naissance, photo…) sont des données personnelles :
     * ils sont écrits dans {@code uploads/dossiers/}, dossier NON servi publiquement, et ne
     * sont accessibles que via le téléchargement contrôlé {@code /api/fichiers/**}.</p>
     */
    private String enregistrerFichier(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        return stockage.enregistrer(file, "dossiers", StockageFichierService.Categorie.DOCUMENT).url();
    }

    private AnneeAcademique getAnneeCourante(Universite uni) {
        // Année ACTIVE de l'université (définie par l'admin) — et non une année calendaire,
        // qui tenterait de créer une année sans université (universite_id NOT NULL → 400).
        return anneeRepo.findByUniversiteId(uni.getId()).stream()
            .filter(AnneeAcademique::isActive)
            .findFirst()
            .orElseGet(() -> {
                int annee = LocalDate.now().getYear();
                String libelle = annee + "-" + (annee + 1);
                return anneeRepo.findByLibelleAndUniversite(libelle, uni)
                    .orElseGet(() -> anneeRepo.save(new AnneeAcademique(libelle, true, uni)));
            });
    }

    private String genererMatricule(Universite uni, AnneeAcademique annee) {
        String codeUni = uni.getCode().toUpperCase().replaceAll("[^A-Z0-9]", "");
        String anneeStr = annee.getLibelle().split("-")[0];
        long count = inscriptionRepo.countByUniversite_IdAndAnneeAcademique_Id(uni.getId(), annee.getId());
        return String.format("%s%s%05d", codeUni, anneeStr, count + 1);
    }
}