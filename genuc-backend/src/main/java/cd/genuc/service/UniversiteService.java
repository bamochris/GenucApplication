package cd.genuc.service;

import cd.genuc.config.cache.CacheNames;
import cd.genuc.dto.EnregistrementUniversiteRequest;
import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UniversiteService {

    private final UniversiteRepository universiteRepo;
    private final InscriptionRepository inscriptionRepo;
    private final FaculteRepository faculteRepo;
    private final DepartementRepository departementRepo;
    private final FiliereRepository filiereRepo;
    private final PromotionRepository promotionRepo;
    private final AnneeAcademiqueRepository anneeAcademiqueRepo;
    private final UniversitePaymentSettingsRepository paymentSettingsRepo;
    private final StockageFichierService stockage;

    /**
     * Liste consommée par le portail public et par tous les écrans d'accueil : c'est
     * l'endpoint le plus appelé de la plateforme, pour une donnée qui change quelques fois
     * par an. Elle n'était pas cachée du tout — chaque affichage repartait en base.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.UNIVERSITES_PUBLIQUES, key = "'actives'")
    public List<Universite> listerToutes() {
        return avecEffectifs(universiteRepo.findAllActifesOrdered());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.UNIVERSITES_PUBLIQUES, key = "'inscriptions-ouvertes'")
    public List<Universite> listerInscriptionsOuvertes() {
        return avecEffectifs(universiteRepo.findByInscriptionsOuvertesTrue());
    }

    /**
     * Renseigne l'effectif étudiant de chaque établissement de la liste.
     *
     * <p>Appelé À L'INTÉRIEUR des méthodes cachées, à dessein : enrichir après
     * coup reviendrait à muter les instances rendues par le cache — celles de
     * Caffeine sont partagées entre requêtes concurrentes. La contrepartie est
     * que l'effectif suit le TTL du cache (15 min pour universites-publiques),
     * ce qui est sans conséquence pour un chiffre de vitrine.</p>
     *
     * <p>Une seule requête groupée, quel que soit le nombre d'établissements.</p>
     */
    private List<Universite> avecEffectifs(List<Universite> universites) {
        if (universites == null || universites.isEmpty()) {
            return universites;
        }
        Map<Long, Long> effectifs = new HashMap<>();
        for (Object[] ligne : inscriptionRepo.compterEtudiantsValidesParUniversite()) {
            effectifs.put((Long) ligne[0], (Long) ligne[1]);
        }
        // Un etablissement sans inscription validee est absent du resultat :
        // il doit afficher 0, pas un tiret.
        universites.forEach(u -> u.setNbEtudiants(effectifs.getOrDefault(u.getId(), 0L)));
        return universites;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.UNIVERSITES, key = "#id")
    public Universite obtenir(Long id) {
        return universiteRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Université introuvable : id=" + id));
    }

    public Universite obtenirParCode(String code) {
        return universiteRepo.findByCode(code.toUpperCase())
            .orElseThrow(() -> new RuntimeException("Université introuvable : code=" + code));
    }

    @Transactional
    @CacheEvict(value = CacheNames.UNIVERSITES_PUBLIQUES, allEntries = true)
    public Universite creer(Map<String, Object> data) {
        String code = ((String) data.get("code")).toUpperCase().trim();
        if (universiteRepo.existsByCode(code)) {
            throw new RuntimeException("Le code '" + code + "' est déjà utilisé");
        }
        Universite uni = Universite.builder()
            .nom((String) data.get("nom"))
            .code(code)
            .ville((String) data.get("ville"))
            .adresse((String) data.get("adresse"))
            .telephone((String) data.get("telephone"))
            .email((String) data.get("email"))
            .siteWeb((String) data.get("siteWeb"))
            .description((String) data.get("description"))
            .logo((String) data.get("logo"))
            .anneeFondation(data.get("anneeFondation") != null ? Integer.valueOf(data.get("anneeFondation").toString()) : null)
            .fraisBase(data.get("fraisBase") != null ? Double.valueOf(data.get("fraisBase").toString()) : 0.0)
            .inscriptionsOuvertes(false)
            .actif(true)
            .build();
        return universiteRepo.save(uni);
    }

    @Caching(evict = {
        @CacheEvict(value = CacheNames.UNIVERSITES, key = "#id"),
        // Nom, logo, ville, ouverture des inscriptions… apparaissent tous dans les listes
        // publiques : les laisser en cache afficherait l'ancienne fiche sur le portail.
        @CacheEvict(value = CacheNames.UNIVERSITES_PUBLIQUES, allEntries = true)
    })
    @Transactional
    public Universite modifier(Long id, Map<String, Object> data) {
        Universite uni = obtenir(id);

        // ─── Informations générales ────────────────────────────
        if (data.containsKey("nom"))              uni.setNom((String) data.get("nom"));
        if (data.containsKey("code"))              uni.setCode(((String) data.get("code")).toUpperCase().trim());
        if (data.containsKey("typeEtablissement")) uni.setTypeEtablissement((String) data.get("typeEtablissement"));
        if (data.containsKey("statut"))            uni.setStatut((String) data.get("statut"));
        if (data.containsKey("anneeFondation"))    uni.setAnneeFondation(Integer.valueOf(data.get("anneeFondation").toString()));
        if (data.containsKey("description"))       uni.setDescription((String) data.get("description"));

        // ─── Informations administratives ──────────────────────
        if (data.containsKey("agrementNumero")) uni.setAgrementNumero((String) data.get("agrementNumero"));
        if (data.containsKey("rccm"))           uni.setRccm((String) data.get("rccm"));
        if (data.containsKey("idNat"))          uni.setIdNat((String) data.get("idNat"));
        if (data.containsKey("nif"))            uni.setNif((String) data.get("nif"));

        // ─── Adresse et localisation ────────────────────────────
        if (data.containsKey("adresse"))  uni.setAdresse((String) data.get("adresse"));
        if (data.containsKey("ville"))    uni.setVille((String) data.get("ville"));
        if (data.containsKey("province")) uni.setProvince((String) data.get("province"));
        if (data.containsKey("commune"))  uni.setCommune((String) data.get("commune"));
        if (data.containsKey("quartier")) uni.setQuartier((String) data.get("quartier"));
        if (data.containsKey("avenue"))   uni.setAvenue((String) data.get("avenue"));
        if (data.containsKey("gps"))      uni.setGps((String) data.get("gps"));

        // ─── Contact ─────────────────────────────────────────────
        if (data.containsKey("telephone"))          uni.setTelephone((String) data.get("telephone"));
        if (data.containsKey("telephoneSecondaire")) uni.setTelephoneSecondaire((String) data.get("telephoneSecondaire"));
        if (data.containsKey("email"))              uni.setEmail((String) data.get("email"));
        if (data.containsKey("siteWeb"))            uni.setSiteWeb((String) data.get("siteWeb"));
        if (data.containsKey("facebook"))           uni.setFacebook((String) data.get("facebook"));
        if (data.containsKey("linkedin"))           uni.setLinkedin((String) data.get("linkedin"));

        // ─── Identité visuelle ───────────────────────────────────
        if (data.containsKey("modulesActifs"))    uni.setModulesActifs((String) data.get("modulesActifs"));
        if (data.containsKey("logo"))              uni.setLogo((String) data.get("logo"));
        if (data.containsKey("couleurPrincipale")) uni.setCouleurPrincipale((String) data.get("couleurPrincipale"));

        // ─── Autorité (recteur) ──────────────────────────────────
        if (data.containsKey("recteurNom"))       uni.setRecteurNom((String) data.get("recteurNom"));
        if (data.containsKey("recteurPostnom"))   uni.setRecteurPostnom((String) data.get("recteurPostnom"));
        if (data.containsKey("recteurPrenom"))    uni.setRecteurPrenom((String) data.get("recteurPrenom"));
        if (data.containsKey("recteurTelephone")) uni.setRecteurTelephone((String) data.get("recteurTelephone"));
        if (data.containsKey("recteurEmail"))     uni.setRecteurEmail((String) data.get("recteurEmail"));

        // ─── Paramètres académiques ──────────────────────────────
        if (data.containsKey("anneeAcademique")) uni.setAnneeAcademique((String) data.get("anneeAcademique"));
        if (data.containsKey("systemeNote"))     uni.setSystemeNote((String) data.get("systemeNote"));
        if (data.containsKey("seuilReussite"))   uni.setSeuilReussite(Integer.valueOf(data.get("seuilReussite").toString()));
        if (data.containsKey("maxSessions"))     uni.setMaxSessions(Integer.valueOf(data.get("maxSessions").toString()));
        if (data.containsKey("lmd"))             uni.setLmd(Boolean.valueOf(data.get("lmd").toString()));

        // ─── Paramètres financiers ────────────────────────────────
        if (data.containsKey("devise"))            uni.setDevise((String) data.get("devise"));
        if (data.containsKey("fraisAcademiques"))  uni.setFraisAcademiques(Double.valueOf(data.get("fraisAcademiques").toString()));
        if (data.containsKey("fraisInscription"))  uni.setFraisInscription(Double.valueOf(data.get("fraisInscription").toString()));
        if (data.containsKey("fraisLabo"))         uni.setFraisLabo(Double.valueOf(data.get("fraisLabo").toString()));
        if (data.containsKey("fraisBibliotheque")) uni.setFraisBibliotheque(Double.valueOf(data.get("fraisBibliotheque").toString()));
        if (data.containsKey("fraisBase"))         uni.setFraisBase(Double.valueOf(data.get("fraisBase").toString()));

        return universiteRepo.save(uni);
    }

    @Caching(evict = {
        @CacheEvict(value = CacheNames.UNIVERSITES, key = "#id"),
        // Nom, logo, ville, ouverture des inscriptions… apparaissent tous dans les listes
        // publiques : les laisser en cache afficherait l'ancienne fiche sur le portail.
        @CacheEvict(value = CacheNames.UNIVERSITES_PUBLIQUES, allEntries = true)
    })
    @Transactional
    public Universite remplacerLogo(Long id, MultipartFile logo) {
        Universite uni = obtenir(id);
        uni.setLogo(sauvegarderFichier(logo, "universites", StockageFichierService.Categorie.IMAGE));
        return universiteRepo.save(uni);
    }

    @Caching(evict = {
        @CacheEvict(value = CacheNames.UNIVERSITES, key = "#id"),
        // Nom, logo, ville, ouverture des inscriptions… apparaissent tous dans les listes
        // publiques : les laisser en cache afficherait l'ancienne fiche sur le portail.
        @CacheEvict(value = CacheNames.UNIVERSITES_PUBLIQUES, allEntries = true)
    })
    @Transactional
    public Universite toggleInscriptions(Long id) {
        Universite uni = obtenir(id);
        uni.setInscriptionsOuvertes(!uni.isInscriptionsOuvertes());
        return universiteRepo.save(uni);
    }

    @Caching(evict = {
        @CacheEvict(value = CacheNames.UNIVERSITES, key = "#id"),
        // Nom, logo, ville, ouverture des inscriptions… apparaissent tous dans les listes
        // publiques : les laisser en cache afficherait l'ancienne fiche sur le portail.
        @CacheEvict(value = CacheNames.UNIVERSITES_PUBLIQUES, allEntries = true)
    })
    @Transactional
    public Universite toggleActif(Long id) {
        Universite uni = obtenir(id);
        uni.setActif(!uni.isActif());
        return universiteRepo.save(uni);
    }

    @Caching(evict = {
        @CacheEvict(value = CacheNames.UNIVERSITES, key = "#id"),
        // Nom, logo, ville, ouverture des inscriptions… apparaissent tous dans les listes
        // publiques : les laisser en cache afficherait l'ancienne fiche sur le portail.
        @CacheEvict(value = CacheNames.UNIVERSITES_PUBLIQUES, allEntries = true)
    })
    @Transactional
    public void desactiver(Long id) {
        Universite uni = obtenir(id);
        uni.setActif(false);
        universiteRepo.save(uni);
    }

    // Suppression définitive (contrairement à desactiver(), qui ne fait que
    // masquer l'université). La plupart des tables liées sont en CASCADE côté
    // base de données (départements, inscriptions, cours, paiements…) et sont
    // donc supprimées automatiquement. Quelques tables sont en NO ACTION
    // (années académiques, paramètres d'encaissement) et bloqueraient la
    // suppression : on les vide explicitement avant de supprimer la ligne.
    // Si une autre table liée bloque malgré tout, l'exception remonte telle
    // quelle pour être traduite en message clair par le contrôleur.
    @Caching(evict = {
        @CacheEvict(value = CacheNames.UNIVERSITES, key = "#id"),
        // Nom, logo, ville, ouverture des inscriptions… apparaissent tous dans les listes
        // publiques : les laisser en cache afficherait l'ancienne fiche sur le portail.
        @CacheEvict(value = CacheNames.UNIVERSITES_PUBLIQUES, allEntries = true)
    })
    @Transactional
    public void supprimerDefinitivement(Long id) {
        Universite uni = obtenir(id);
        anneeAcademiqueRepo.deleteAll(anneeAcademiqueRepo.findByUniversiteId(id));
        paymentSettingsRepo.findByUniversiteId(id).ifPresent(paymentSettingsRepo::delete);
        universiteRepo.delete(uni);
    }

    public Map<String, Object> statistiques(Long id) {
        Universite uni = obtenir(id);
        long nbEtudiants = universiteRepo.countEtudiantsValides(id);
        long nbDepts = universiteRepo.countDepartementsActifs(id);
        long nbInscriptionsEnAttente = universiteRepo.countInscriptionsEnAttente(id);
        return Map.of(
            "universite", uni.getNom(),
            "code", uni.getCode(),
            "ville", uni.getVille(),
            "nbEtudiants", nbEtudiants,
            "nbDepartements", nbDepts,
            "nbInscriptionsEnAttente", nbInscriptionsEnAttente,
            "inscriptionsOuvertes", uni.isInscriptionsOuvertes(),
            "actif", uni.isActif()
        );
    }

    public List<Departement> listerDepartements(Long universiteId) {
        return departementRepo.findByUniversiteIdAndActifTrue(universiteId);
    }

    public List<Departement> listerTousDepartements(Long universiteId) {
        return departementRepo.findByUniversiteId(universiteId);
    }

    public Departement obtenirDepartement(Long id) {
        return departementRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Département introuvable : id=" + id));
    }

    @Transactional
    public Departement creerDepartement(Long universiteId, Map<String, Object> data) {
        Universite uni = obtenir(universiteId);
        String nom = data.get("nom") != null ? ((String) data.get("nom")).trim() : "";
        String code = data.get("code") != null ? ((String) data.get("code")).toUpperCase().trim() : "";
        if (nom.isBlank()) {
            throw new RuntimeException("Le nom du département est obligatoire.");
        }
        if (code.isBlank()) {
            throw new RuntimeException("Le code du département est obligatoire.");
        }
        if (departementRepo.existsByCodeAndUniversiteId(code, universiteId)) {
            throw new RuntimeException("Le code '" + code + "' existe déjà dans cette université.");
        }
        Faculte faculte = faculteRepo.findByUniversiteId(universiteId).stream().findFirst()
                .orElseGet(() -> faculteRepo.save(Faculte.builder()
                        .nom("Faculté principale")
                        .code(uni.getCode() + "-MAIN")
                        .universite(uni)
                        .active(true)
                        .build()));
        Departement dept = Departement.builder()
            .nom(nom)
            .code(code)
            .type(parseTypeDepartement(data.get("type")))
            .description((String) data.get("description"))
            .faculte(faculte)
            .universite(uni)
            .actif(true)
            .build();
        return departementRepo.save(dept);
    }

    @Transactional
    public Departement modifierDepartement(Long id, Map<String, Object> data) {
        Departement dept = obtenirDepartement(id);
        if (data.containsKey("nom"))              dept.setNom((String) data.get("nom"));
        if (data.containsKey("code"))             dept.setCode(((String) data.get("code")).toUpperCase().trim());
        if (data.containsKey("description"))      dept.setDescription((String) data.get("description"));
        if (data.containsKey("type"))             dept.setType(parseTypeDepartement(data.get("type")));
        return departementRepo.save(dept);
    }

    /** Convertit la valeur envoyée en {@link Departement.TypeDepartement}, avec un message clair si invalide. */
    private Departement.TypeDepartement parseTypeDepartement(Object raw) {
        if (raw == null || ((String) raw).isBlank()) {
            return Departement.TypeDepartement.DEPARTEMENT;
        }
        try {
            return Departement.TypeDepartement.valueOf(((String) raw).trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Type de département invalide : « " + raw + " ».");
        }
    }

    @Transactional
    public void desactiverDepartement(Long id) {
        Departement dept = obtenirDepartement(id);
        dept.setActif(false);
        departementRepo.save(dept);
    }

    @Transactional
    public void activerDepartement(Long id) {
        Departement dept = obtenirDepartement(id);
        dept.setActif(true);
        departementRepo.save(dept);
    }

    public Map<String, Object> obtenirUniversiteComplete(Long id) {
        Universite uni = obtenir(id);
        List<Departement> departements = listerDepartements(id);
        List<Departement> departementsInactifs = departementRepo.findByUniversiteIdAndActifTrue(id);
        return Map.of(
            "universite", uni,
            "departements", departements,
            "stats", Map.of(
                "nbDepartements", departements.size(),
                "nbDepartementsInactifs", departementsInactifs.size()
            )
        );
    }

    @Transactional
    @CacheEvict(value = CacheNames.UNIVERSITES_PUBLIQUES, allEntries = true)
    public Universite enregistrerUniversiteComplete(
            EnregistrementUniversiteRequest request,
            MultipartFile logo,
            MultipartFile agrement,
            MultipartFile arrete,
            MultipartFile statuts) {

        if (request.getNom() == null || request.getNom().isBlank()) {
            throw new RuntimeException("Le nom de l'université est obligatoire");
        }

        // ─── Code unique de l'université (à partir du sigle) ───
        String base = (request.getSigle() != null && !request.getSigle().isBlank())
                ? request.getSigle().toUpperCase().trim().replaceAll("[^A-Z0-9]", "")
                : genererCode(request.getNom(), null);
        String code = base;
        for (int i = 2; universiteRepo.existsByCode(code); i++) {
            code = base + i;
        }

        // ─── Date d'autorisation (tolérante) ───
        java.time.LocalDate agrementDate = null;
        if (request.getDateAutorisation() != null && !request.getDateAutorisation().isBlank()) {
            try {
                agrementDate = java.time.LocalDate.parse(request.getDateAutorisation());
            } catch (Exception ignored) { /* format libre : on n'échoue pas pour une date */ }
        }

        String gps = null;
        if (request.getLatitude() != null && !request.getLatitude().isBlank()
                && request.getLongitude() != null && !request.getLongitude().isBlank()) {
            gps = request.getLatitude().trim() + "," + request.getLongitude().trim();
        }

        // ─── Listes plates pour l'affichage public ───
        List<String> facultesNoms = request.getFacultes() != null ? request.getFacultes() : List.of();
        List<String> departementsNoms = request.getDepartements() != null
                ? request.getDepartements().values().stream().flatMap(List::stream).collect(Collectors.toList())
                : List.of();
        List<String> promotionsNoms = request.getPromotions() != null
                ? request.getPromotions().values().stream().flatMap(List::stream)
                    .map(EnregistrementUniversiteRequest.PromotionDTO::getNiveau)
                    .filter(Objects::nonNull).distinct().collect(Collectors.toList())
                : List.of();

        Universite uni = Universite.builder()
                .nom(request.getNom().trim())
                .code(code)
                .typeEtablissement(request.getType())
                .statut(request.getStatut())
                .anneeFondation(request.getAnneeFondation())
                .agrementNumero(request.getAgrementNumero())
                .agrementDate(agrementDate)
                .adresse(request.getAdresse())
                .ville(request.getVille())
                .province(request.getProvince())
                .commune(request.getCommune())
                .quartier(request.getZone())
                .gps(gps)
                .telephone(request.getTelephone())
                .telephoneSecondaire(request.getTelephoneFixe())
                .email(request.getEmail())
                .siteWeb(request.getSiteWeb())
                .recteurNom(request.getRecteur() != null ? request.getRecteur().getNom() : null)
                .recteurPrenom(request.getRecteur() != null ? request.getRecteur().getPrenom() : null)
                .recteurEmail(request.getRecteur() != null ? request.getRecteur().getEmail() : null)
                .recteurTelephone(request.getRecteur() != null ? request.getRecteur().getTelephone() : null)
                .anneeAcademique(request.getAnneeAcademique())
                .systemeNote(request.getNotation())
                .maxSessions(request.getSessions())
                .lmd("LMD".equalsIgnoreCase(request.getSysteme()))
                .devise(request.getDevise())
                .fraisBase(0.0)
                .inscriptionsOuvertes(false)
                .actif(true)
                .facultes(new ArrayList<>(facultesNoms))
                .departements(new ArrayList<>(departementsNoms))
                .promotions(new ArrayList<>(promotionsNoms))
                .build();

        // ─── Fichiers ───
        // Le logo est de l'affichage de marque : il reste dans "universites", servi
        // publiquement (une page publique doit pouvoir l'afficher sans jeton).
        // Les documents légaux partent dans un dossier séparé, NON public : ils ne
        // sont consultés que par l'administration via le téléchargement contrôlé.
        uni.setLogo(sauvegarderFichier(logo, "universites", StockageFichierService.Categorie.IMAGE));
        uni.setDocumentAgrement(sauvegarderFichier(agrement, "universites-documents",
                StockageFichierService.Categorie.DOCUMENT));
        uni.setDocumentArrete(sauvegarderFichier(arrete, "universites-documents",
                StockageFichierService.Categorie.DOCUMENT));
        uni.setDocumentStatuts(sauvegarderFichier(statuts, "universites-documents",
                StockageFichierService.Categorie.DOCUMENT));

        uni = universiteRepo.save(uni);

        AnneeAcademique annee = getOrCreateAnneeAcademique(request.getAnneeAcademique(), uni);

        // ─── Facultés ───
        Map<String, Faculte> facultesParNom = new LinkedHashMap<>();
        Set<String> codesUtilises = new HashSet<>();
        for (String nomFac : facultesNoms) {
            if (nomFac == null || nomFac.isBlank()) continue;
            Faculte fac = faculteRepo.save(Faculte.builder()
                    .nom(nomFac.trim())
                    .code(codeUnique(genererCode(nomFac, code), codesUtilises))
                    .universite(uni)
                    .active(true)
                    .build());
            facultesParNom.put(nomFac.trim(), fac);
        }

        // ─── Départements (clé = nom de la faculté) ───
        Map<String, Departement> departementsParNom = new LinkedHashMap<>();
        if (request.getDepartements() != null) {
            for (Map.Entry<String, List<String>> entree : request.getDepartements().entrySet()) {
                Faculte fac = facultesParNom.get(entree.getKey() != null ? entree.getKey().trim() : "");
                if (fac == null) continue; // faculté supprimée du formulaire : on ignore ses départements
                for (String nomDept : entree.getValue()) {
                    if (nomDept == null || nomDept.isBlank()) continue;
                    Departement dept = departementRepo.save(Departement.builder()
                            .nom(nomDept.trim())
                            .code(codeUnique(genererCode(nomDept, code), codesUtilises))
                            .type(Departement.TypeDepartement.DEPARTEMENT)
                            .faculte(fac)
                            .universite(uni)
                            .actif(true)
                            .build());
                    departementsParNom.put(nomDept.trim(), dept);
                }
            }
        }

        // ─── Options / filières (clé = nom du département) ───
        Map<String, Filiere> filieresParNom = new LinkedHashMap<>();
        if (request.getOptions() != null) {
            for (Map.Entry<String, List<String>> entree : request.getOptions().entrySet()) {
                Departement dept = departementsParNom.get(entree.getKey() != null ? entree.getKey().trim() : "");
                if (dept == null) continue;
                for (String nomOption : entree.getValue()) {
                    if (nomOption == null || nomOption.isBlank()) continue;
                    Filiere filiere = filiereRepo.save(Filiere.builder()
                            .nom(nomOption.trim())
                            .code(codeUnique(genererCode(nomOption, code), codesUtilises))
                            .departement(dept)
                            .actif(true)
                            .build());
                    filieresParNom.put(nomOption.trim(), filiere);
                }
            }
        }

        // ─── Promotions avec vacations (clé = nom de l'option) ───
        if (request.getPromotions() != null) {
            for (Map.Entry<String, List<EnregistrementUniversiteRequest.PromotionDTO>> entree
                    : request.getPromotions().entrySet()) {
                Filiere filiere = filieresParNom.get(entree.getKey() != null ? entree.getKey().trim() : "");
                if (filiere == null) continue;
                for (EnregistrementUniversiteRequest.PromotionDTO promo : entree.getValue()) {
                    if (promo == null || promo.getNiveau() == null || promo.getNiveau().isBlank()) continue;
                    promotionRepo.save(Promotion.builder()
                            .libelle(promo.getNiveau().trim())
                            .niveau(convertirLibelleVersNiveau(promo.getNiveau()))
                            .filiere(filiere)
                            .anneeAcademique(annee)
                            .vacations(normaliserVacations(promo.getVacations()))
                            .actif(true)
                            .build());
                }
            }
        }

        return uni;
    }

    // Valide et normalise la liste de vacations en CSV ("JOUR", "SOIR", "JOUR,SOIR").
    // Par défaut : JOUR (organisation classique en RDC).
    private String normaliserVacations(List<String> vacations) {
        if (vacations == null || vacations.isEmpty()) return TypeVacation.JOUR.name();
        String csv = vacations.stream()
                .filter(Objects::nonNull)
                .map(v -> v.trim().toUpperCase())
                .filter(v -> {
                    try { TypeVacation.valueOf(v); return true; }
                    catch (IllegalArgumentException e) { return false; }
                })
                .distinct()
                .collect(Collectors.joining(","));
        return csv.isEmpty() ? TypeVacation.JOUR.name() : csv;
    }

    // Suffixe numérique si le code généré est déjà pris dans cette université.
    private String codeUnique(String codeBase, Set<String> codesUtilises) {
        String candidat = codeBase;
        for (int i = 2; codesUtilises.contains(candidat); i++) {
            candidat = codeBase + i;
        }
        codesUtilises.add(candidat);
        return candidat;
    }

    private String genererCode(String nom, String prefixe) {
        String propre = nom == null ? "" : nom.replaceAll("[^\\p{L}0-9 ]", " ").trim();
        StringBuilder initiales = new StringBuilder();
        for (String mot : propre.split("\\s+")) {
            if (!mot.isEmpty()) initiales.append(Character.toUpperCase(mot.charAt(0)));
        }
        String sigle = initiales.length() >= 2
                ? initiales.toString()
                : propre.toUpperCase().replaceAll("\\s+", "");
        if (sigle.length() > 10) sigle = sigle.substring(0, 10);
        if (sigle.isEmpty()) sigle = "GEN";
        return (prefixe != null && !prefixe.isBlank()) ? prefixe + "-" + sigle : sigle;
    }

    private Promotion.Niveau convertirLibelleVersNiveau(String libelle) {
        if (libelle == null) return Promotion.Niveau.L1;
        try {
            return Promotion.Niveau.valueOf(libelle.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return Promotion.Niveau.L1; // niveau libre (ex: "Préparatoire") : L1 par défaut
        }
    }

    private AnneeAcademique getOrCreateAnneeAcademique(String libelle, Universite uni) {
        String lib = (libelle == null || libelle.isBlank())
                ? String.valueOf(java.time.Year.now().getValue()) + "-" + (java.time.Year.now().getValue() + 1)
                : libelle.trim();
        return anneeAcademiqueRepo.findByLibelleAndUniversite(lib, uni)
                .orElseGet(() -> anneeAcademiqueRepo.save(
                        AnneeAcademique.builder().libelle(lib).active(true).universite(uni).build()));
    }

    private String sauvegarderFichier(MultipartFile file, String dossier,
                                      StockageFichierService.Categorie categorie) {
        if (file == null || file.isEmpty()) return null;
        return stockage.enregistrer(file, dossier, categorie).url();
    }
}