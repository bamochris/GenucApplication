package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.MigrationImport.StatutMigration;
import cd.genuc.model.MigrationLigne.ActionDoublon;
import cd.genuc.model.MigrationLigne.StatutLigne;
import cd.genuc.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Migration assistée intelligente : analyse d'un fichier Excel/CSV, mapping
 * automatique mémorisé par université, vérification à trois niveaux
 * (vert/orange/rouge), correction en ligne, simulation, import par lots
 * transactionnels (500 lignes) avec pause/reprise/annulation, et centre des
 * erreurs pour réimporter uniquement les lignes corrigées.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MigrationImportService {

    private final MigrationImportRepository migrationRepo;
    private final MigrationLigneRepository ligneRepo;
    private final UniversiteRepository universiteRepo;
    private final InscriptionRepository inscriptionRepo;
    private final DepartementRepository departementRepo;
    private final FiliereRepository filiereRepo;
    private final PromotionRepository promotionRepo;
    private final AnneeAcademiqueRepository anneeRepo;
    private final PaiementRepository paiementRepo;
    private final EtudiantRepository etudiantRepo;
    private final ObjectMapper json;
    private final PlatformTransactionManager transactionManager;

    private static final int TAILLE_LOT = 500;

    // Imports en cours (thread par migration) — évite les doubles lancements.
    private final Set<Long> importsActifs = ConcurrentHashMap.newKeySet();

    // ─── Champs canoniques + synonymes pour le mapping automatique ─────────
    public static final List<String> CHAMPS_CIBLES = List.of(
        "matricule", "nom", "postnom", "prenom", "sexe", "dateNaissance",
        "lieuNaissance", "email", "telephone", "adresse",
        "faculte", "departement", "filiere", "promotion", "niveau",
        "montantPaye", "devise", "datePaiement", "ignorer");

    private static final Map<String, List<String>> SYNONYMES = Map.ofEntries(
        Map.entry("matricule",     List.of("matricule", "mat", "numero etudiant", "num etudiant", "id etudiant", "code etudiant")),
        Map.entry("nom",           List.of("nom", "nom complet", "noms", "nom de famille", "name", "nom et postnom")),
        Map.entry("postnom",       List.of("postnom", "post-nom", "post nom", "middlename")),
        Map.entry("prenom",        List.of("prenom", "prenoms", "firstname")),
        Map.entry("sexe",          List.of("sexe", "genre", "gender", "m/f")),
        Map.entry("dateNaissance", List.of("date de naissance", "date naissance", "naissance", "ne le", "nee le", "birthdate", "dob")),
        Map.entry("lieuNaissance", List.of("lieu de naissance", "lieu naissance")),
        Map.entry("email",         List.of("email", "e-mail", "mail", "adresse email", "courriel")),
        Map.entry("telephone",     List.of("telephone", "tel", "phone", "numero de telephone", "gsm", "contact")),
        Map.entry("adresse",       List.of("adresse", "domicile", "residence")),
        Map.entry("faculte",       List.of("faculte", "fac", "faculty")),
        Map.entry("departement",   List.of("departement", "dept", "department", "section")),
        Map.entry("filiere",       List.of("filiere", "option", "specialite", "orientation")),
        Map.entry("promotion",     List.of("promotion", "promo", "classe", "annee etude", "annee detude", "level")),
        Map.entry("niveau",        List.of("niveau", "cycle", "grade")),
        Map.entry("montantPaye",   List.of("montant paye", "montant", "paiement", "paye", "total paye", "frais payes", "somme versee", "verse")),
        Map.entry("devise",        List.of("devise", "monnaie", "currency")),
        Map.entry("datePaiement",  List.of("date paiement", "date de paiement", "date versement"))
    );

    // ══════════════════════════════════════════════════════════════════════
    // ÉTAPES 1-2 : CRÉATION + ANALYSE AUTOMATIQUE
    // ══════════════════════════════════════════════════════════════════════

    public MigrationImport creer(String nomMigration, Long universiteId, String anneeAcademique,
                                  MultipartFile fichier, String creePar) throws Exception {
        Universite universite = universiteRepo.findById(universiteId)
            .orElseThrow(() -> new RuntimeException("Université introuvable"));

        String nomFichier = fichier.getOriginalFilename() != null ? fichier.getOriginalFilename() : "fichier";
        boolean excel = nomFichier.toLowerCase().matches(".*\\.(xlsx|xls)$");

        List<List<String>> tableau = excel ? lireExcel(fichier) : lireCsv(fichier);
        if (tableau.size() < 2) {
            throw new RuntimeException("Le fichier doit contenir une ligne d'en-tête et au moins une ligne de données.");
        }

        List<String> colonnes = tableau.get(0);
        List<List<String>> lignes = tableau.subList(1, tableau.size());

        MigrationImport migration = MigrationImport.builder()
            .nom(nomMigration)
            .universite(universite)
            .anneeAcademique(anneeAcademique)
            .typeFichier(excel ? MigrationImport.TypeFichier.EXCEL : MigrationImport.TypeFichier.CSV)
            .nomFichierOriginal(nomFichier)
            .statut(StatutMigration.ANALYSE)
            .etape(2)
            .totalLignes(lignes.size())
            .colonnesJson(json.writeValueAsString(colonnes))
            .creePar(creePar)
            .build();
        migration = migrationRepo.save(migration);

        // Persister chaque ligne brute
        List<MigrationLigne> entites = new ArrayList<>();
        for (int i = 0; i < lignes.size(); i++) {
            Map<String, String> donnees = new LinkedHashMap<>();
            List<String> ligne = lignes.get(i);
            for (int c = 0; c < colonnes.size(); c++) {
                donnees.put(colonnes.get(c), c < ligne.size() ? ligne.get(c).trim() : "");
            }
            entites.add(MigrationLigne.builder()
                .migration(migration)
                .numeroLigne(i + 1)
                .donneesJson(json.writeValueAsString(donnees))
                .statut(StatutLigne.VALIDE)
                .build());
        }
        ligneRepo.saveAll(entites);

        // Analyse sans import + proposition de mapping (mémorisé si possible)
        Map<String, Object> stats = analyser(migration, colonnes, lignes);
        Map<String, String> mapping = proposerMapping(universiteId, colonnes);
        migration.setStatsJson(json.writeValueAsString(Map.of("analyse", stats)));
        migration.setMappingJson(json.writeValueAsString(mapping));
        migration.setOptionsJson(json.writeValueAsString(Map.of(
            "creerStructures", true, "strategieDoublon", "METTRE_A_JOUR")));
        return migrationRepo.save(migration);
    }

    private Map<String, Object> analyser(MigrationImport migration, List<String> colonnes, List<List<String>> lignes) {
        int cellulesVides = 0, lignesIncompletes = 0;
        Set<String> matriculesVus = new HashSet<>();
        int doublonsInternes = 0;
        Set<String> promotions = new TreeSet<>(), departements = new TreeSet<>(), facultes = new TreeSet<>();
        int lignesAvecMontant = 0;

        int idxMat = indexColonne(colonnes, "matricule");
        int idxPromo = indexColonne(colonnes, "promotion");
        int idxDept = indexColonne(colonnes, "departement");
        int idxFac = indexColonne(colonnes, "faculte");
        int idxMontant = indexColonne(colonnes, "montantPaye");

        for (List<String> l : lignes) {
            int vides = 0;
            for (int c = 0; c < colonnes.size(); c++) {
                String v = c < l.size() ? l.get(c).trim() : "";
                if (v.isEmpty()) { vides++; cellulesVides++; }
            }
            if (vides > colonnes.size() / 2) lignesIncompletes++;
            if (idxMat >= 0 && idxMat < l.size() && !l.get(idxMat).isBlank()
                && !matriculesVus.add(l.get(idxMat).trim().toUpperCase())) doublonsInternes++;
            if (idxPromo >= 0 && idxPromo < l.size() && !l.get(idxPromo).isBlank()) promotions.add(l.get(idxPromo).trim());
            if (idxDept >= 0 && idxDept < l.size() && !l.get(idxDept).isBlank()) departements.add(l.get(idxDept).trim());
            if (idxFac >= 0 && idxFac < l.size() && !l.get(idxFac).isBlank()) facultes.add(l.get(idxFac).trim());
            if (idxMontant >= 0 && idxMontant < l.size() && parseMontant(l.get(idxMontant)) != null) lignesAvecMontant++;
        }

        // Structures inconnues par rapport à l'existant
        Set<String> deptsExistants = new HashSet<>();
        departementRepo.findByUniversiteId(migration.getUniversite().getId())
            .forEach(d -> deptsExistants.add(normaliser(d.getNom())));
        long structuresInconnues = departements.stream().filter(d -> !deptsExistants.contains(normaliser(d))).count()
            + facultes.stream().filter(d -> !deptsExistants.contains(normaliser(d))).count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("etudiants", lignes.size());
        stats.put("colonnes", colonnes.size());
        stats.put("departements", departements.size() + facultes.size());
        stats.put("promotions", promotions.size());
        stats.put("paiements", lignesAvecMontant);
        stats.put("cellulesVides", cellulesVides);
        stats.put("lignesIncompletes", lignesIncompletes);
        stats.put("doublonsInternes", doublonsInternes);
        stats.put("structuresInconnues", structuresInconnues);
        stats.put("listePromotions", new ArrayList<>(promotions));
        stats.put("listeDepartements", new ArrayList<>(departements));
        stats.put("listeFacultes", new ArrayList<>(facultes));
        return stats;
    }

    // ══════════════════════════════════════════════════════════════════════
    // ÉTAPE 3 : MAPPING INTELLIGENT (mémorisé par université)
    // ══════════════════════════════════════════════════════════════════════

    private Map<String, String> proposerMapping(Long universiteId, List<String> colonnes) {
        // 1. Réutiliser le mapping mémorisé si les en-têtes correspondent
        Map<String, String> memorise = mappingMemorise(universiteId);
        Map<String, String> mapping = new LinkedHashMap<>();
        for (String col : colonnes) {
            if (memorise.containsKey(col)) {
                mapping.put(col, memorise.get(col));
                continue;
            }
            // 2. Sinon, correspondance par synonymes
            String n = normaliser(col);
            String cible = "ignorer";
            for (Map.Entry<String, List<String>> e : SYNONYMES.entrySet()) {
                if (e.getValue().stream().anyMatch(s -> n.equals(normaliser(s)) || n.contains(normaliser(s)))) {
                    cible = e.getKey();
                    break;
                }
            }
            mapping.put(col, cible);
        }
        return mapping;
    }

    private Map<String, String> mappingMemorise(Long universiteId) {
        return migrationRepo.findFirstByUniversiteIdAndMappingJsonIsNotNullOrderByCreeLeDesc(universiteId)
            .map(m -> lireMap(m.getMappingJson()))
            .orElse(Map.of());
    }

    public MigrationImport confirmerMapping(Long id, Map<String, String> mapping) throws Exception {
        MigrationImport migration = obtenir(id);
        migration.setMappingJson(json.writeValueAsString(mapping));
        migration.setStatut(StatutMigration.MAPPING);
        migration.setEtape(4);
        migrationRepo.save(migration);
        return verifier(id);
    }

    public void confirmerOptions(Long id, Map<String, Object> options) throws Exception {
        MigrationImport migration = obtenir(id);
        Map<String, Object> actuelles = lireMapObjet(migration.getOptionsJson());
        actuelles.putAll(options);
        migration.setOptionsJson(json.writeValueAsString(actuelles));
        migrationRepo.save(migration);
    }

    // ══════════════════════════════════════════════════════════════════════
    // ÉTAPE 4 : VÉRIFICATION À TROIS NIVEAUX
    // ══════════════════════════════════════════════════════════════════════

    public MigrationImport verifier(Long id) throws Exception {
        MigrationImport migration = obtenir(id);
        Map<String, String> mapping = lireMap(migration.getMappingJson());
        boolean creerStructures = optionBool(migration, "creerStructures", true);

        Set<String> matriculesInternes = new HashSet<>();
        Set<String> deptsExistants = new HashSet<>();
        departementRepo.findByUniversiteId(migration.getUniversite().getId())
            .forEach(d -> deptsExistants.add(normaliser(d.getNom())));

        int erreurs = 0;
        List<MigrationLigne> lignes = ligneRepo.findByMigrationIdAndStatutInOrderByNumeroLigne(
            id, List.of(StatutLigne.VALIDE, StatutLigne.AVERTISSEMENT, StatutLigne.ERREUR));

        for (MigrationLigne ligne : lignes) {
            List<Map<String, String>> problemes = validerLigne(migration, ligne, mapping,
                matriculesInternes, deptsExistants, creerStructures);
            ligne.setErreursJson(json.writeValueAsString(problemes));
            StatutLigne statut = StatutLigne.VALIDE;
            for (Map<String, String> p : problemes) {
                if ("ROUGE".equals(p.get("niveau"))) { statut = StatutLigne.ERREUR; break; }
                if ("ORANGE".equals(p.get("niveau"))) statut = StatutLigne.AVERTISSEMENT;
            }
            if (statut == StatutLigne.ERREUR) erreurs++;
            ligne.setStatut(statut);
        }
        ligneRepo.saveAll(lignes);

        migration.setLignesErreur(erreurs);
        migration.setStatut(StatutMigration.VERIFICATION);
        if (migration.getEtape() < 4) migration.setEtape(4);
        return migrationRepo.save(migration);
    }

    private List<Map<String, String>> validerLigne(MigrationImport migration, MigrationLigne ligne,
                                                    Map<String, String> mapping,
                                                    Set<String> matriculesInternes,
                                                    Set<String> deptsExistants,
                                                    boolean creerStructures) {
        Map<String, String> valeurs = valeursCanoniques(ligne, mapping);
        List<Map<String, String>> problemes = new ArrayList<>();

        String nom = valeurs.getOrDefault("nom", "");
        String prenom = valeurs.getOrDefault("prenom", "");
        if (nom.isBlank() && prenom.isBlank()) {
            problemes.add(probleme("nom", "ROUGE", "Nom et prénom manquants"));
        } else if (nom.isBlank()) {
            problemes.add(probleme("nom", "ORANGE", "Nom manquant"));
        }

        String matricule = valeurs.getOrDefault("matricule", "").trim().toUpperCase();
        if (!matricule.isBlank()) {
            if (!matriculesInternes.add(matricule)) {
                problemes.add(probleme("matricule", "ROUGE", "Matricule dupliqué dans le fichier : " + matricule));
            } else if (inscriptionRepo.findByMatriculeAndUniversiteId(matricule, migration.getUniversite().getId()).isPresent()) {
                problemes.add(probleme("matricule", "ORANGE",
                    "Matricule déjà existant dans GENUC — fusion, ignorer ou créer ?"));
            }
        }

        String email = valeurs.getOrDefault("email", "");
        if (!email.isBlank() && !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            problemes.add(probleme("email", "ORANGE", "Email invalide : " + email));
        }

        String dateNaissance = valeurs.getOrDefault("dateNaissance", "");
        if (!dateNaissance.isBlank() && parseDate(dateNaissance) == null) {
            problemes.add(probleme("dateNaissance", "ORANGE", "Date invalide : " + dateNaissance));
        }

        String montant = valeurs.getOrDefault("montantPaye", "");
        if (!montant.isBlank()) {
            Double m = parseMontant(montant);
            if (m == null) {
                problemes.add(probleme("montantPaye", "ORANGE", "Montant illisible : " + montant));
            } else if (m < 0) {
                problemes.add(probleme("montantPaye", "ROUGE", "Paiement négatif : " + m));
            }
        }

        String datePaiement = valeurs.getOrDefault("datePaiement", "");
        if (!datePaiement.isBlank() && parseDate(datePaiement) == null) {
            problemes.add(probleme("datePaiement", "ORANGE", "Date de paiement invalide : " + datePaiement));
        }

        String dept = !valeurs.getOrDefault("departement", "").isBlank()
            ? valeurs.get("departement") : valeurs.getOrDefault("faculte", "");
        if (dept.isBlank()) {
            problemes.add(probleme("departement", "VERT", "Département/faculté non renseigné"));
        } else if (!deptsExistants.contains(normaliser(dept))) {
            problemes.add(probleme("departement", creerStructures ? "VERT" : "ORANGE",
                creerStructures ? "Département « " + dept + " » sera créé automatiquement"
                                : "Département inconnu : " + dept));
        }

        if (valeurs.getOrDefault("promotion", "").isBlank()) {
            problemes.add(probleme("promotion", "VERT", "Promotion non renseignée"));
        }
        return problemes;
    }

    // ══════════════════════════════════════════════════════════════════════
    // ÉTAPE 5 : CORRECTION EN LIGNE
    // ══════════════════════════════════════════════════════════════════════

    public MigrationLigne corrigerLigne(Long migrationId, Long ligneId,
                                        Map<String, String> nouvellesDonnees, String action) throws Exception {
        MigrationImport migration = obtenir(migrationId);
        MigrationLigne ligne = ligneRepo.findById(ligneId)
            .orElseThrow(() -> new RuntimeException("Ligne introuvable"));
        if (!ligne.getMigration().getId().equals(migrationId)) {
            throw new RuntimeException("Cette ligne n'appartient pas à cette migration");
        }
        if (nouvellesDonnees != null && !nouvellesDonnees.isEmpty()) {
            Map<String, String> donnees = lireMap(ligne.getDonneesJson());
            donnees.putAll(nouvellesDonnees);
            ligne.setDonneesJson(json.writeValueAsString(donnees));
        }
        if (action != null && !action.isBlank()) {
            ligne.setAction(ActionDoublon.valueOf(action));
        }

        // Revalidation immédiate de la seule ligne corrigée
        Map<String, String> mapping = lireMap(migration.getMappingJson());
        Set<String> deptsExistants = new HashSet<>();
        departementRepo.findByUniversiteId(migration.getUniversite().getId())
            .forEach(d -> deptsExistants.add(normaliser(d.getNom())));
        List<Map<String, String>> problemes = validerLigne(migration, ligne, mapping,
            new HashSet<>(), deptsExistants, optionBool(migration, "creerStructures", true));
        ligne.setErreursJson(json.writeValueAsString(problemes));
        StatutLigne statut = StatutLigne.VALIDE;
        for (Map<String, String> p : problemes) {
            if ("ROUGE".equals(p.get("niveau"))) { statut = StatutLigne.ERREUR; break; }
            if ("ORANGE".equals(p.get("niveau"))) statut = StatutLigne.AVERTISSEMENT;
        }
        ligne.setStatut(statut);
        ligne = ligneRepo.save(ligne);

        migration.setLignesErreur((int) ligneRepo.countByMigrationIdAndStatut(migrationId, StatutLigne.ERREUR));
        migrationRepo.save(migration);
        return ligne;
    }

    // ══════════════════════════════════════════════════════════════════════
    // ÉTAPE 6 : SIMULATION (aucune écriture)
    // ══════════════════════════════════════════════════════════════════════

    public Map<String, Object> simuler(Long id) throws Exception {
        MigrationImport migration = obtenir(id);
        long valides = ligneRepo.countByMigrationIdAndStatut(id, StatutLigne.VALIDE);
        long avertissements = ligneRepo.countByMigrationIdAndStatut(id, StatutLigne.AVERTISSEMENT);
        long erreurs = ligneRepo.countByMigrationIdAndStatut(id, StatutLigne.ERREUR);
        long dejaImportees = ligneRepo.countByMigrationIdAndStatut(id, StatutLigne.IMPORTEE);

        Map<String, String> mapping = lireMap(migration.getMappingJson());
        long paiements = 0;
        Set<String> structuresACreer = new TreeSet<>();
        Set<String> deptsExistants = new HashSet<>();
        departementRepo.findByUniversiteId(migration.getUniversite().getId())
            .forEach(d -> deptsExistants.add(normaliser(d.getNom())));

        for (MigrationLigne ligne : ligneRepo.findByMigrationIdAndStatutInOrderByNumeroLigne(
                id, List.of(StatutLigne.VALIDE, StatutLigne.AVERTISSEMENT))) {
            Map<String, String> v = valeursCanoniques(ligne, mapping);
            Double m = parseMontant(v.getOrDefault("montantPaye", ""));
            if (m != null && m > 0) paiements++;
            String dept = !v.getOrDefault("departement", "").isBlank()
                ? v.get("departement") : v.getOrDefault("faculte", "");
            if (!dept.isBlank() && !deptsExistants.contains(normaliser(dept))) structuresACreer.add(dept);
        }

        Map<String, Object> simulation = new LinkedHashMap<>();
        simulation.put("importables", valides + avertissements);
        simulation.put("aCorriger", erreurs);
        simulation.put("dejaImportees", dejaImportees);
        simulation.put("paiements", paiements);
        simulation.put("structuresACreer", new ArrayList<>(structuresACreer));
        simulation.put("tempsEstimeSecondes", Math.max(5, (valides + avertissements) / 40));

        Map<String, Object> stats = lireMapObjet(migration.getStatsJson());
        stats.put("simulation", simulation);
        migration.setStatsJson(json.writeValueAsString(stats));
        migration.setStatut(StatutMigration.SIMULATION);
        migration.setEtape(6);
        migrationRepo.save(migration);
        return simulation;
    }

    // ══════════════════════════════════════════════════════════════════════
    // ÉTAPE 7 : IMPORT PROGRESSIF PAR LOTS TRANSACTIONNELS
    // ══════════════════════════════════════════════════════════════════════

    public void demarrerImport(Long id) {
        MigrationImport migration = obtenir(id);
        if (!importsActifs.add(id)) {
            throw new RuntimeException("Un import est déjà en cours pour cette migration.");
        }
        migration.setStatut(StatutMigration.EN_COURS);
        migration.setEtape(7);
        migrationRepo.save(migration);

        Thread t = new Thread(() -> {
            try {
                executerImport(id);
            } catch (Exception e) {
                log.error("Import migration {} interrompu : ", id, e);
                MigrationImport m = migrationRepo.findById(id).orElse(null);
                if (m != null && m.getStatut() == StatutMigration.EN_COURS) {
                    m.setStatut(StatutMigration.ERREURS);
                    migrationRepo.save(m);
                }
            } finally {
                importsActifs.remove(id);
            }
        }, "migration-import-" + id);
        t.setDaemon(true);
        t.start();
    }

    private void executerImport(Long id) throws Exception {
        MigrationImport migration = obtenir(id);
        Map<String, String> mapping = lireMap(migration.getMappingJson());
        boolean creerStructures = optionBool(migration, "creerStructures", true);
        String strategieDoublon = optionStr(migration, "strategieDoublon", "METTRE_A_JOUR");

        // Seules les lignes prêtes et jamais importées sont traitées : une
        // reprise (pause, crash, réimport après corrections) ne refait jamais
        // le travail déjà accompli.
        List<MigrationLigne> aTraiter = ligneRepo.findByMigrationIdAndStatutInOrderByNumeroLigne(
            id, List.of(StatutLigne.VALIDE, StatutLigne.AVERTISSEMENT));

        long total = ligneRepo.countByMigrationId(id);
        // Caches structures pour l'import (évite un SELECT par ligne)
        Map<String, Departement> cacheDepts = new HashMap<>();
        Map<String, Filiere> cacheFilieres = new HashMap<>();
        Map<String, Promotion> cachePromos = new HashMap<>();

        for (int debut = 0; debut < aTraiter.size(); debut += TAILLE_LOT) {
            // Pause / annulation demandée entre deux lots ?
            MigrationImport etat = migrationRepo.findById(id).orElseThrow();
            if (etat.getStatut() == StatutMigration.PAUSE || etat.getStatut() == StatutMigration.ANNULE) {
                log.info("Import migration {} suspendu ({})", id, etat.getStatut());
                return;
            }

            List<MigrationLigne> lot = aTraiter.subList(debut, Math.min(debut + TAILLE_LOT, aTraiter.size()));
            TransactionTemplate tx = new TransactionTemplate(transactionManager);
            try {
                // Chemin nominal : le lot entier dans une seule transaction.
                tx.executeWithoutResult(status -> {
                    for (MigrationLigne ligne : lot) {
                        importerLigne(migration, ligne, mapping, creerStructures, strategieDoublon,
                            cacheDepts, cacheFilieres, cachePromos);
                        ligneRepo.save(ligne);
                    }
                });
            } catch (Exception echecLot) {
                // Une ligne a fait échouer le lot (la transaction PostgreSQL est
                // avortée dès la première erreur SQL) : on rejoue le lot ligne
                // par ligne, chacune dans sa propre transaction, pour n'écarter
                // QUE les lignes réellement fautives.
                log.warn("Migration {} : lot en échec ({}), reprise ligne par ligne",
                    id, echecLot.getMessage());
                // Les caches peuvent référencer des entités créées dans la
                // transaction annulée : on repart de zéro.
                cacheDepts.clear(); cacheFilieres.clear(); cachePromos.clear();
                for (MigrationLigne ligne : lot) {
                    try {
                        tx.executeWithoutResult(status -> {
                            importerLigne(migration, ligne, mapping, creerStructures, strategieDoublon,
                                cacheDepts, cacheFilieres, cachePromos);
                            ligneRepo.save(ligne);
                        });
                    } catch (Exception e) {
                        log.warn("Migration {} ligne {} rejetée : {}", id, ligne.getNumeroLigne(), e.getMessage());
                        cacheDepts.clear(); cacheFilieres.clear(); cachePromos.clear();
                        ligne.setStatut(StatutLigne.ERREUR);
                        try {
                            ligne.setErreursJson(json.writeValueAsString(List.of(
                                probleme("import", "ROUGE", "Échec à l'import : " + resumeErreur(e)))));
                        } catch (Exception ignore) { }
                        // Transaction dédiée pour tracer l'échec de cette ligne
                        tx.executeWithoutResult(status -> ligneRepo.save(ligne));
                    }
                }
            }

            // Progression persistée après chaque lot
            MigrationImport maj = migrationRepo.findById(id).orElseThrow();
            maj.setLignesImportees((int) ligneRepo.countByMigrationIdAndStatut(id, StatutLigne.IMPORTEE));
            maj.setLignesIgnorees((int) ligneRepo.countByMigrationIdAndStatut(id, StatutLigne.IGNOREE));
            maj.setLignesErreur((int) ligneRepo.countByMigrationIdAndStatut(id, StatutLigne.ERREUR));
            long traitees = maj.getLignesImportees() + maj.getLignesIgnorees() + maj.getLignesErreur();
            maj.setProgression(total > 0 ? (int) (traitees * 100 / total) : 100);
            migrationRepo.save(maj);
        }

        MigrationImport fin = migrationRepo.findById(id).orElseThrow();
        long erreurs = ligneRepo.countByMigrationIdAndStatut(id, StatutLigne.ERREUR);
        fin.setStatut(erreurs > 0 ? StatutMigration.ERREURS : StatutMigration.TERMINE);
        fin.setEtape(erreurs > 0 ? 8 : 8);
        fin.setProgression(100);
        migrationRepo.save(fin);
        log.info("Import migration {} terminé : {} importées, {} erreurs", id, fin.getLignesImportees(), erreurs);
    }

    private void importerLigne(MigrationImport migration, MigrationLigne ligne,
                                Map<String, String> mapping, boolean creerStructures, String strategieDoublon,
                                Map<String, Departement> cacheDepts,
                                Map<String, Filiere> cacheFilieres,
                                Map<String, Promotion> cachePromos) {
        Map<String, String> v = valeursCanoniques(ligne, mapping);
        Universite universite = migration.getUniversite();

        // ─── Doublon : matricule déjà présent dans GENUC ────────────────
        String matricule = v.getOrDefault("matricule", "").trim().toUpperCase();
        Inscription existante = matricule.isBlank() ? null
            : inscriptionRepo.findByMatriculeAndUniversiteId(matricule, universite.getId()).orElse(null);

        ActionDoublon action = ligne.getAction() != null ? ligne.getAction()
            : ActionDoublon.valueOf(strategieDoublon);
        if (existante != null && action == ActionDoublon.IGNORER) {
            ligne.setStatut(StatutLigne.IGNOREE);
            return;
        }

        // ─── Structures : département/faculté → filière → promotion ─────
        Departement dept = null;
        Filiere filiere = null;
        Promotion promotion = null;
        String nomDept = !v.getOrDefault("departement", "").isBlank()
            ? v.get("departement") : v.getOrDefault("faculte", "");
        if (!nomDept.isBlank()) {
            dept = resoudreDepartement(universite, nomDept, !v.getOrDefault("faculte", "").isBlank()
                && v.getOrDefault("departement", "").isBlank(), creerStructures, cacheDepts);
        }
        String nomFiliere = v.getOrDefault("filiere", "");
        if (dept != null && !nomFiliere.isBlank()) {
            filiere = resoudreFiliere(dept, nomFiliere, creerStructures, cacheFilieres);
        }
        String libellePromo = v.getOrDefault("promotion", "");
        if (filiere != null && !libellePromo.isBlank()) {
            promotion = resoudrePromotion(migration, filiere, libellePromo, creerStructures, cachePromos);
        }

        // ─── Étudiant (référentiel personne, obligatoire pour l'inscription) ─
        Etudiant etudiant;
        if (existante != null && action == ActionDoublon.METTRE_A_JOUR && existante.getEtudiant() != null) {
            etudiant = existante.getEtudiant();
        } else {
            String email = v.getOrDefault("email", "").trim().toLowerCase();
            etudiant = (!matricule.isBlank()
                    ? etudiantRepo.findByMatriculePermanent(matricule) : Optional.<Etudiant>empty())
                .or(() -> email.isBlank() ? Optional.empty() : etudiantRepo.findByEmail(email))
                .orElse(null);
            if (etudiant == null) {
                etudiant = Etudiant.builder()
                    .matriculePermanent(!matricule.isBlank() ? matricule
                        : "MIG-" + universite.getId() + "-" + migration.getId() + "-" + ligne.getNumeroLigne())
                    .nom(v.getOrDefault("nom", "").toUpperCase())
                    .prenom(v.getOrDefault("prenom", ""))
                    .email(email.isBlank() ? null : email)
                    .telephone(v.getOrDefault("telephone", "").isBlank() ? null : v.get("telephone"))
                    .sexe(v.getOrDefault("sexe", "").isBlank() ? null : normaliserSexe(v.get("sexe")))
                    .lieuNaissance(v.getOrDefault("lieuNaissance", "").isBlank() ? null : v.get("lieuNaissance"))
                    .adresse(v.getOrDefault("adresse", "").isBlank() ? null : v.get("adresse"))
                    .dateNaissance(parseDate(v.getOrDefault("dateNaissance", "")))
                    .actif(true)
                    .build();
                etudiant = etudiantRepo.save(etudiant);
                // Créé par la migration → supprimable en cas d'annulation
                ligne.setEtudiantId(etudiant.getId());
            }
        }

        // ─── Inscription (création ou fusion) ────────────────────────────
        Inscription inscription = (existante != null && action == ActionDoublon.METTRE_A_JOUR)
            ? existante : new Inscription();
        inscription.setEtudiant(etudiant);
        if (!v.getOrDefault("nom", "").isBlank())       inscription.setNom(v.get("nom").toUpperCase());
        if (!v.getOrDefault("prenom", "").isBlank())    inscription.setPrenom(v.get("prenom"));
        if (!v.getOrDefault("email", "").isBlank())     inscription.setEmail(v.get("email").toLowerCase());
        if (!v.getOrDefault("telephone", "").isBlank()) inscription.setTelephone(v.get("telephone"));
        if (!v.getOrDefault("sexe", "").isBlank())      inscription.setSexe(normaliserSexe(v.get("sexe")));
        if (!v.getOrDefault("adresse", "").isBlank())   inscription.setAdresse(v.get("adresse"));
        if (!v.getOrDefault("lieuNaissance", "").isBlank()) inscription.setLieuNaissance(v.get("lieuNaissance"));
        LocalDate naissance = parseDate(v.getOrDefault("dateNaissance", ""));
        if (naissance != null) inscription.setDateNaissance(naissance);
        String niveau = !v.getOrDefault("niveau", "").isBlank() ? v.get("niveau") : libellePromo;
        if (!niveau.isBlank()) inscription.setNiveau(niveau);
        if (inscription.getMatricule() == null || inscription.getMatricule().isBlank()) {
            inscription.setMatricule(!matricule.isBlank() ? matricule
                : "MIG-" + universite.getId() + "-" + migration.getId() + "-" + ligne.getNumeroLigne());
        }
        inscription.setUniversite(universite);
        if (dept != null)      inscription.setDepartement(dept);
        if (filiere != null)   inscription.setFiliere(filiere);
        if (promotion != null) inscription.setPromotion(promotion);
        inscription.setAnneeAcademique(resoudreAnnee(anneeLibelleOuDefaut(migration), universite));
        inscription.setStatut(StatutInscription.VALIDE);
        if (inscription.getCommentaire() == null || inscription.getCommentaire().isBlank()) {
            inscription.setCommentaire("Importé par migration « " + migration.getNom() + " »");
        }
        inscription = inscriptionRepo.save(inscription);
        ligne.setInscriptionId(inscription.getId());

        // ─── Situation financière : paiement historique validé ──────────
        Double montant = parseMontant(v.getOrDefault("montantPaye", ""));
        if (montant != null && montant > 0 && ligne.getPaiementId() == null) {
            Paiement paiement = new Paiement();
            paiement.setReference("MIG-" + migration.getId() + "-" + ligne.getNumeroLigne());
            paiement.setMontant(montant);
            paiement.setDevise(!v.getOrDefault("devise", "").isBlank() ? v.get("devise").toUpperCase() : "USD");
            paiement.setModePaiement(Paiement.ModePaiement.ESPECES);
            paiement.setStatut(Paiement.StatutPaiement.VALIDE);
            paiement.setType(Paiement.TypePaiement.FRAIS_ACADEMIQUES);
            LocalDate datePaiement = parseDate(v.getOrDefault("datePaiement", ""));
            paiement.setDatePaiement(datePaiement != null ? datePaiement : LocalDate.now());
            paiement.setDateValidation(LocalDate.now());
            paiement.setInscription(inscription);
            paiement.setUniversite(universite);
            paiement.setNotesCaisse("Historique importé — migration « " + migration.getNom() + " »");
            paiement = paiementRepo.save(paiement);
            ligne.setPaiementId(paiement.getId());
        }

        ligne.setStatut(StatutLigne.IMPORTEE);
        ligne.setErreursJson(null);
    }

    private Departement resoudreDepartement(Universite universite, String nom, boolean estFaculte,
                                             boolean creer, Map<String, Departement> cache) {
        String cle = normaliser(nom);
        return cache.computeIfAbsent(cle, k -> {
            for (Departement d : departementRepo.findByUniversiteId(universite.getId())) {
                if (normaliser(d.getNom()).equals(k)) return d;
            }
            if (!creer) return null;
            Departement d = new Departement();
            d.setNom(nom.trim());
            d.setCode(codeDepuisNom(nom));
            d.setType(estFaculte ? Departement.TypeDepartement.FACULTE : Departement.TypeDepartement.DEPARTEMENT);
            d.setUniversite(universite);
            d.setActif(true);
            return departementRepo.save(d);
        });
    }

    private Filiere resoudreFiliere(Departement dept, String nom, boolean creer, Map<String, Filiere> cache) {
        String cle = dept.getId() + "|" + normaliser(nom);
        return cache.computeIfAbsent(cle, k -> {
            for (Filiere f : filiereRepo.findByDepartementId(dept.getId())) {
                if (normaliser(f.getNom()).equals(normaliser(nom))) return f;
            }
            if (!creer) return null;
            return filiereRepo.save(Filiere.builder()
                .nom(nom.trim())
                .code(codeDepuisNom(nom))
                .departement(dept)
                .actif(true)
                .build());
        });
    }

    private Promotion resoudrePromotion(MigrationImport migration, Filiere filiere, String libelle,
                                         boolean creer, Map<String, Promotion> cache) {
        String cle = filiere.getId() + "|" + normaliser(libelle);
        return cache.computeIfAbsent(cle, k -> {
            for (Promotion p : promotionRepo.findByFiliereId(filiere.getId())) {
                if (normaliser(p.getLibelle()).equals(normaliser(libelle))) return p;
            }
            if (!creer) return null;
            Promotion p = new Promotion();
            p.setLibelle(libelle.trim());
            p.setFiliere(filiere);
            // L'année académique est obligatoire sur une promotion : à défaut
            // d'année fournie par la migration, on prend l'année active (ou on
            // la crée à partir de la date du jour).
            p.setAnneeAcademique(resoudreAnnee(anneeLibelleOuDefaut(migration), migration.getUniversite()));
            return promotionRepo.save(p);
        });
    }

    private String anneeLibelleOuDefaut(MigrationImport migration) {
        if (migration.getAnneeAcademique() != null && !migration.getAnneeAcademique().isBlank()) {
            return migration.getAnneeAcademique();
        }
        List<AnneeAcademique> actives = anneeRepo.findByActiveTrue();
        if (!actives.isEmpty()) return actives.get(0).getLibelle();
        int annee = LocalDate.now().getMonthValue() >= 9
            ? LocalDate.now().getYear() : LocalDate.now().getYear() - 1;
        return annee + "-" + (annee + 1);
    }

    // Message d'erreur lisible pour l'utilisateur (sans la pile SQL complète)
    private String resumeErreur(Exception e) {
        String msg = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
        Throwable cause = e.getCause();
        while (cause != null && cause.getMessage() != null) {
            msg = cause.getMessage();
            cause = cause.getCause();
        }
        return msg.length() > 300 ? msg.substring(0, 300) + "…" : msg;
    }

    private AnneeAcademique resoudreAnnee(String libelle, Universite universite) {
        // Pas de repli sur le seul libellé : il rendait l'année d'un AUTRE
        // établissement, à laquelle les données importées se seraient rattachées
        // — et il échouait de toute façon dès que plusieurs lignes portaient ce
        // libellé. Absente, l'année est créée pour cet établissement, juste après.
        return anneeRepo.findByLibelleAndUniversite(libelle.trim(), universite)
            .orElseGet(() -> {
                AnneeAcademique a = new AnneeAcademique();
                a.setLibelle(libelle.trim());
                a.setActive(true);
                a.setUniversite(universite);
                return anneeRepo.save(a);
            });
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAUSE / REPRISE / ANNULATION / RÉIMPORT
    // ══════════════════════════════════════════════════════════════════════

    public MigrationImport pauser(Long id) {
        MigrationImport migration = obtenir(id);
        if (migration.getStatut() != StatutMigration.EN_COURS) {
            throw new RuntimeException("Seule une migration en cours peut être mise en pause.");
        }
        migration.setStatut(StatutMigration.PAUSE);
        return migrationRepo.save(migration);
    }

    public void reprendre(Long id) {
        MigrationImport migration = obtenir(id);
        if (migration.getStatut() != StatutMigration.PAUSE && migration.getStatut() != StatutMigration.ERREURS) {
            throw new RuntimeException("Cette migration n'est ni en pause ni en attente de corrections.");
        }
        demarrerImport(id);
    }

    /**
     * Annulation avec retour à l'état précédent : toutes les inscriptions et
     * paiements créés par cette migration sont supprimés, tant que la
     * migration n'a pas été supprimée. Chaque ligne redevient corrigeable.
     */
    public MigrationImport annuler(Long id) {
        MigrationImport migration = obtenir(id);
        if (migration.getStatut() == StatutMigration.EN_COURS) {
            // L'import s'arrêtera au prochain lot (le thread lit le statut).
            migration.setStatut(StatutMigration.ANNULE);
            migrationRepo.save(migration);
        }
        new TransactionTemplate(transactionManager).executeWithoutResult(tx -> {
            for (MigrationLigne ligne : ligneRepo.findByMigrationIdAndStatut(id, StatutLigne.IMPORTEE)) {
                if (ligne.getPaiementId() != null) {
                    paiementRepo.deleteById(ligne.getPaiementId());
                    ligne.setPaiementId(null);
                }
                if (ligne.getInscriptionId() != null) {
                    try {
                        inscriptionRepo.deleteById(ligne.getInscriptionId());
                    } catch (Exception e) {
                        // L'inscription a déjà d'autres données rattachées (notes,
                        // présences…) : on la conserve pour ne rien casser.
                        log.warn("Annulation migration {} : inscription {} conservée ({})",
                            id, ligne.getInscriptionId(), e.getMessage());
                    }
                    ligne.setInscriptionId(null);
                }
                if (ligne.getEtudiantId() != null) {
                    try {
                        etudiantRepo.deleteById(ligne.getEtudiantId());
                    } catch (Exception e) {
                        log.warn("Annulation migration {} : étudiant {} conservé ({})",
                            id, ligne.getEtudiantId(), e.getMessage());
                    }
                    ligne.setEtudiantId(null);
                }
                ligne.setStatut(StatutLigne.VALIDE);
                ligneRepo.save(ligne);
            }
        });
        migration.setStatut(StatutMigration.ANNULE);
        migration.setProgression(0);
        migration.setLignesImportees(0);
        migration.setLignesIgnorees(0);
        return migrationRepo.save(migration);
    }

    // ══════════════════════════════════════════════════════════════════════
    // CONSULTATION
    // ══════════════════════════════════════════════════════════════════════

    public MigrationImport obtenir(Long id) {
        return migrationRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Migration introuvable : " + id));
    }

    public Map<String, Object> detail(Long id) {
        MigrationImport migration = obtenir(id);
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("id", migration.getId());
        d.put("nom", migration.getNom());
        d.put("universiteId", migration.getUniversite().getId());
        d.put("universiteNom", migration.getUniversite().getNom());
        d.put("anneeAcademique", migration.getAnneeAcademique());
        d.put("typeFichier", migration.getTypeFichier());
        d.put("nomFichierOriginal", migration.getNomFichierOriginal());
        d.put("statut", migration.getStatut());
        d.put("etape", migration.getEtape());
        d.put("totalLignes", migration.getTotalLignes());
        d.put("lignesImportees", migration.getLignesImportees());
        d.put("lignesIgnorees", migration.getLignesIgnorees());
        d.put("lignesErreur", migration.getLignesErreur());
        d.put("progression", migration.getProgression());
        d.put("colonnes", lireListe(migration.getColonnesJson()));
        d.put("mapping", lireMap(migration.getMappingJson()));
        d.put("stats", lireMapObjet(migration.getStatsJson()));
        d.put("options", lireMapObjet(migration.getOptionsJson()));
        d.put("champsCibles", CHAMPS_CIBLES);
        d.put("creeLe", migration.getCreeLe());
        d.put("majLe", migration.getMajLe());
        d.put("creePar", migration.getCreePar());
        return d;
    }

    // ══════════════════════════════════════════════════════════════════════
    // MODÈLE EXCEL TÉLÉCHARGEABLE
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Génère le modèle Excel prêt à remplir : une feuille « Etudiants » avec
     * en-têtes stylés et exemples, et une feuille « Instructions » expliquant
     * chaque colonne (obligatoire/facultatif, formats acceptés).
     */
    public byte[] genererModeleExcel() throws Exception {
        String[] colonnes = {
            "Matricule", "Nom", "Postnom", "Prenom", "Sexe", "Date de naissance",
            "Email", "Telephone", "Faculte", "Departement", "Filiere", "Promotion",
            "Montant paye", "Devise", "Date paiement"
        };
        String[][] exemples = {
            {"HEC-2024-001", "KABONGO", "MWAMBA", "Jean", "M", "12/05/2001",
             "jean.kabongo@exemple.cd", "+243810000001", "Sciences Commerciales",
             "Commerce", "Comptabilite", "L2", "450", "USD", "15/01/2026"},
            {"HEC-2024-002", "MBUYI", "", "Sarah", "F", "22/07/2002",
             "sarah.mbuyi@exemple.cd", "+243820000002", "Sciences Commerciales",
             "Commerce", "Marketing", "L1", "300", "USD", "20/01/2026"},
        };
        String[][] instructions = {
            {"Colonne", "Obligatoire ?", "Format / Remarques"},
            {"Matricule", "Fortement conseillé", "Identifiant unique de l'étudiant. S'il existe déjà dans GENUC, vous choisirez : fusionner, ignorer ou créer."},
            {"Nom / Prenom", "Oui (au moins l'un des deux)", "Texte libre."},
            {"Postnom", "Non", "Texte libre."},
            {"Sexe", "Non", "M ou F."},
            {"Date de naissance", "Non", "jj/mm/aaaa (ex : 12/05/2001). Aussi acceptés : 12-05-2001, 2001-05-12."},
            {"Email / Telephone", "Non", "Utilisés pour le compte étudiant et les notifications."},
            {"Faculte / Departement", "Non", "Créés automatiquement s'ils n'existent pas encore (option activable)."},
            {"Filiere", "Non", "Créée automatiquement sous le département."},
            {"Promotion", "Non", "L1, L2, G3, M1… (la colonne peut aussi s'appeler « Classe »)."},
            {"Montant paye", "Non", "Situation financière : total déjà payé par l'étudiant. Nombre positif."},
            {"Devise", "Non", "USD ou CDF (USD par défaut)."},
            {"Date paiement", "Non", "jj/mm/aaaa — date du dernier versement."},
            {"", "", ""},
            {"Règles générales", "", "1 ligne = 1 étudiant. La 1ère ligne contient les en-têtes. Les noms de colonnes sont libres : GENUC les reconnaît et vous laisse corriger le mapping. Rien n'est importé sans votre validation."},
        };

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {

            // ─── Styles ───
            CellStyle styleEntete = wb.createCellStyle();
            org.apache.poi.xssf.usermodel.XSSFFont policeEntete = wb.createFont();
            policeEntete.setBold(true);
            policeEntete.setColor(org.apache.poi.ss.usermodel.IndexedColors.WHITE.getIndex());
            styleEntete.setFont(policeEntete);
            styleEntete.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(
                new byte[]{(byte) 0x18, (byte) 0x5F, (byte) 0xA5}, null));
            styleEntete.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            styleEntete.setAlignment(HorizontalAlignment.CENTER);
            styleEntete.setBorderBottom(BorderStyle.THIN);
            styleEntete.setBorderRight(BorderStyle.THIN);

            CellStyle styleExemple = wb.createCellStyle();
            styleExemple.setBorderBottom(BorderStyle.THIN);
            styleExemple.setBorderRight(BorderStyle.THIN);

            CellStyle styleTitreInstr = wb.createCellStyle();
            org.apache.poi.xssf.usermodel.XSSFFont policeTitre = wb.createFont();
            policeTitre.setBold(true);
            styleTitreInstr.setFont(policeTitre);
            styleTitreInstr.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.GREY_25_PERCENT.getIndex());
            styleTitreInstr.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // ─── Feuille 1 : Etudiants ───
            Sheet feuille = wb.createSheet("Etudiants");
            Row entete = feuille.createRow(0);
            for (int c = 0; c < colonnes.length; c++) {
                Cell cellule = entete.createCell(c);
                cellule.setCellValue(colonnes[c]);
                cellule.setCellStyle(styleEntete);
            }
            for (int r = 0; r < exemples.length; r++) {
                Row ligne = feuille.createRow(r + 1);
                for (int c = 0; c < exemples[r].length; c++) {
                    Cell cellule = ligne.createCell(c);
                    cellule.setCellValue(exemples[r][c]);
                    cellule.setCellStyle(styleExemple);
                }
            }
            feuille.createFreezePane(0, 1);
            for (int c = 0; c < colonnes.length; c++) {
                feuille.autoSizeColumn(c);
                feuille.setColumnWidth(c, Math.min(feuille.getColumnWidth(c) + 600, 9000));
            }

            // ─── Feuille 2 : Instructions ───
            Sheet aide = wb.createSheet("Instructions");
            for (int r = 0; r < instructions.length; r++) {
                Row ligne = aide.createRow(r);
                for (int c = 0; c < instructions[r].length; c++) {
                    Cell cellule = ligne.createCell(c);
                    cellule.setCellValue(instructions[r][c]);
                    if (r == 0) cellule.setCellStyle(styleTitreInstr);
                }
            }
            aide.setColumnWidth(0, 6500);
            aide.setColumnWidth(1, 7000);
            aide.setColumnWidth(2, 26000);

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // LECTURE DE FICHIERS + UTILITAIRES
    // ══════════════════════════════════════════════════════════════════════

    private List<List<String>> lireExcel(MultipartFile fichier) throws Exception {
        List<List<String>> tableau = new ArrayList<>();
        DataFormatter formatter = new DataFormatter(Locale.FRANCE);
        try (Workbook wb = WorkbookFactory.create(fichier.getInputStream())) {
            Sheet feuille = wb.getSheetAt(0);
            int maxCol = 0;
            for (Row row : feuille) {
                maxCol = Math.max(maxCol, row.getLastCellNum());
            }
            for (Row row : feuille) {
                List<String> valeurs = new ArrayList<>();
                boolean vide = true;
                for (int c = 0; c < maxCol; c++) {
                    Cell cell = row.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    String val = cell == null ? "" : formatter.formatCellValue(cell).trim();
                    if (!val.isEmpty()) vide = false;
                    valeurs.add(val);
                }
                if (!vide) tableau.add(valeurs);
            }
        }
        return tableau;
    }

    private List<List<String>> lireCsv(MultipartFile fichier) throws Exception {
        byte[] contenu = fichier.getBytes();
        String texte = new String(contenu, StandardCharsets.UTF_8);
        if (texte.contains("�")) {
            texte = new String(contenu, java.nio.charset.Charset.forName("windows-1252"));
        }
        // Détection du séparateur sur la première ligne
        String premiere = texte.lines().findFirst().orElse("");
        char sep = premiere.chars().filter(ch -> ch == ';').count()
                 > premiere.chars().filter(ch -> ch == ',').count() ? ';' : ',';

        List<List<String>> tableau = new ArrayList<>();
        try (BufferedReader lecteur = new BufferedReader(new InputStreamReader(
                new java.io.ByteArrayInputStream(texte.getBytes(StandardCharsets.UTF_8)), StandardCharsets.UTF_8))) {
            String ligne;
            while ((ligne = lecteur.readLine()) != null) {
                if (ligne.isBlank()) continue;
                tableau.add(decouperCsv(ligne, sep));
            }
        }
        return tableau;
    }

    // Découpage CSV avec prise en charge des guillemets
    private List<String> decouperCsv(String ligne, char sep) {
        List<String> champs = new ArrayList<>();
        StringBuilder courant = new StringBuilder();
        boolean entreGuillemets = false;
        for (int i = 0; i < ligne.length(); i++) {
            char c = ligne.charAt(i);
            if (c == '"') {
                if (entreGuillemets && i + 1 < ligne.length() && ligne.charAt(i + 1) == '"') {
                    courant.append('"'); i++;
                } else {
                    entreGuillemets = !entreGuillemets;
                }
            } else if (c == sep && !entreGuillemets) {
                champs.add(courant.toString().trim());
                courant.setLength(0);
            } else {
                courant.append(c);
            }
        }
        champs.add(courant.toString().trim());
        return champs;
    }

    private Map<String, String> valeursCanoniques(MigrationLigne ligne, Map<String, String> mapping) {
        Map<String, String> donnees = lireMap(ligne.getDonneesJson());
        Map<String, String> valeurs = new LinkedHashMap<>();
        for (Map.Entry<String, String> e : mapping.entrySet()) {
            String champ = e.getValue();
            if (champ == null || "ignorer".equals(champ)) continue;
            String valeur = donnees.getOrDefault(e.getKey(), "");
            // Si plusieurs colonnes pointent le même champ, la première non vide gagne
            if (!valeurs.containsKey(champ) || valeurs.get(champ).isBlank()) {
                valeurs.put(champ, valeur);
            }
        }
        return valeurs;
    }

    private static final List<DateTimeFormatter> FORMATS_DATE = List.of(
        DateTimeFormatter.ofPattern("dd/MM/yyyy"), DateTimeFormatter.ofPattern("d/M/yyyy"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy"), DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("dd/MM/yy"), DateTimeFormatter.ofPattern("dd.MM.yyyy"));

    private LocalDate parseDate(String valeur) {
        if (valeur == null || valeur.isBlank()) return null;
        for (DateTimeFormatter f : FORMATS_DATE) {
            try { return LocalDate.parse(valeur.trim(), f); } catch (Exception ignore) { }
        }
        return null;
    }

    private Double parseMontant(String valeur) {
        if (valeur == null || valeur.isBlank()) return null;
        String nettoye = valeur.replaceAll("[^0-9,.\\-]", "").replace(",", ".");
        int dernierPoint = nettoye.lastIndexOf('.');
        if (dernierPoint >= 0) {
            nettoye = nettoye.substring(0, dernierPoint).replace(".", "") + nettoye.substring(dernierPoint);
        }
        try { return Double.parseDouble(nettoye); } catch (Exception e) { return null; }
    }

    private String normaliserSexe(String v) {
        String n = normaliser(v);
        if (n.startsWith("f")) return "F";
        if (n.startsWith("m") || n.startsWith("h") || n.startsWith("g")) return "M";
        return v.trim();
    }

    private int indexColonne(List<String> colonnes, String champ) {
        for (int i = 0; i < colonnes.size(); i++) {
            String n = normaliser(colonnes.get(i));
            List<String> syns = SYNONYMES.getOrDefault(champ, List.of());
            for (String s : syns) {
                if (n.equals(normaliser(s)) || n.contains(normaliser(s))) return i;
            }
        }
        return -1;
    }

    private static String normaliser(String s) {
        if (s == null) return "";
        return Normalizer.normalize(s, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "").toLowerCase().trim();
    }

    private static Map<String, String> probleme(String champ, String niveau, String message) {
        Map<String, String> p = new LinkedHashMap<>();
        p.put("champ", champ);
        p.put("niveau", niveau);
        p.put("message", message);
        return p;
    }

    private String codeDepuisNom(String nom) {
        String n = normaliser(nom).replaceAll("[^a-z0-9 ]", "");
        StringBuilder code = new StringBuilder();
        for (String mot : n.split("\\s+")) {
            if (!mot.isBlank()) code.append(Character.toUpperCase(mot.charAt(0)));
        }
        String resultat = code.length() >= 2 ? code.toString() : n.toUpperCase().replace(" ", "");
        return resultat.length() > 10 ? resultat.substring(0, 10) : resultat;
    }

    private Map<String, String> lireMap(String jsonStr) {
        if (jsonStr == null || jsonStr.isBlank()) return new LinkedHashMap<>();
        try { return json.readValue(jsonStr, new TypeReference<LinkedHashMap<String, String>>() {}); }
        catch (Exception e) { return new LinkedHashMap<>(); }
    }

    private Map<String, Object> lireMapObjet(String jsonStr) {
        if (jsonStr == null || jsonStr.isBlank()) return new LinkedHashMap<>();
        try { return json.readValue(jsonStr, new TypeReference<LinkedHashMap<String, Object>>() {}); }
        catch (Exception e) { return new LinkedHashMap<>(); }
    }

    private List<String> lireListe(String jsonStr) {
        if (jsonStr == null || jsonStr.isBlank()) return new ArrayList<>();
        try { return json.readValue(jsonStr, new TypeReference<ArrayList<String>>() {}); }
        catch (Exception e) { return new ArrayList<>(); }
    }

    private boolean optionBool(MigrationImport migration, String cle, boolean defaut) {
        Object v = lireMapObjet(migration.getOptionsJson()).get(cle);
        return v == null ? defaut : Boolean.parseBoolean(v.toString());
    }

    private String optionStr(MigrationImport migration, String cle, String defaut) {
        Object v = lireMapObjet(migration.getOptionsJson()).get(cle);
        return v == null ? defaut : v.toString();
    }
}
