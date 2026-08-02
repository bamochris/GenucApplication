package cd.genuc.config;

import cd.genuc.model.Departement;
import cd.genuc.model.Faculte;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Universite;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.DepartementRepository;
import cd.genuc.repository.FaculteRepository;
import cd.genuc.repository.UniversiteRepository;
import cd.genuc.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
@Profile("!prod")
@Order(1)
@RequiredArgsConstructor
public class DataInitializer {

    private final UniversiteRepository universiteRepo;
    private final FaculteRepository faculteRepo;
    private final DepartementRepository departementRepo;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    // ─── Initialisation des universités ──────────────────────────
    @Bean
    public CommandLineRunner initialiserUniversites() {
        return args -> {
            if (universiteRepo.count() == 0) {
                creerUniversites();
                log.info("✅ Universités et départements de démonstration créés");
            }
        };
    }

    // ─── Initialisation des utilisateurs de test ──────────────────
    @Bean
    public CommandLineRunner initialiserUtilisateurs() {
        return args -> {
            // Toujours s'assurer que le compte super-admin existe
            if (!utilisateurRepository.existsByEmail("admin@genuc.cd")) {
                utilisateurRepository.save(creerUtilisateur(
                    "ADMIN", "Super", "admin@genuc.cd", "Genuc2024!",
                    RoleEnum.SUPER_ADMIN, null, null));
                log.info("✅ Compte super-admin créé");
            }
            // Si moins de 5 utilisateurs, créer tous les comptes de test
            if (utilisateurRepository.count() < 5) {
                creerUtilisateursDeTest();
                log.info("✅ Comptes de test créés");
            } else {
                log.info("ℹ️ Des utilisateurs existent déjà, création ignorée.");
            }
        };
    }

    // ─── Méthodes privées ──────────────────────────────────────────

    private void creerUniversites() {
        // UNIKIN - Kinshasa
        Universite unikin = universiteRepo.save(Universite.builder()
                .nom("Université de Kinshasa")
                .code("UNIKIN")
                .ville("Kinshasa")
                .adresse("Mont Amba, Kinshasa")
                .telephone("+243 81 000 0001")
                .email("info@unikin.ac.cd")
                .siteWeb("www.unikin.ac.cd")
                .anneeFondation(1954)
                .description("La plus grande université du Congo, fondée en 1954.")
                .fraisBase(380.0)
                .inscriptionsOuvertes(true)
                .actif(true)
                .build());
        creerDepts(unikin, new String[][]{
                {"DROIT", "Faculté de Droit", "FACULTE"},
                {"MED", "Faculté de Médecine", "FACULTE"},
                {"INFO", "Département Informatique", "DEPARTEMENT"},
                {"ECON", "Sciences Économiques", "FACULTE"},
                {"LETTRES", "Lettres & Sciences Humaines", "FACULTE"},
                {"POLY", "École Polytechnique", "ECOLE"}
        });

        // UNILU - Lubumbashi
        Universite unilu = universiteRepo.save(Universite.builder()
                .nom("Université de Lubumbashi")
                .code("UNILU")
                .ville("Lubumbashi")
                .adresse("Campus Universitaire, Lubumbashi")
                .telephone("+243 81 000 0002")
                .email("info@unilu.ac.cd")
                .anneeFondation(1955)
                .description("Université publique du Katanga.")
                .fraisBase(350.0)
                .inscriptionsOuvertes(true)
                .actif(true)
                .build());
        creerDepts(unilu, new String[][]{
                {"MINES", "Faculté des Mines", "FACULTE"},
                {"DROIT", "Faculté de Droit", "FACULTE"},
                {"ECON", "Sciences Économiques", "FACULTE"},
                {"INFO", "Informatique & TIC", "DEPARTEMENT"}
        });

        // UNIGOM - Goma
        Universite unigom = universiteRepo.save(Universite.builder()
                .nom("Université de Goma")
                .code("UNIGOM")
                .ville("Goma")
                .adresse("Boulevard Kanyamahanga, Goma")
                .telephone("+243 81 000 0003")
                .email("info@unigom.ac.cd")
                .anneeFondation(2005)
                .fraisBase(320.0)
                .inscriptionsOuvertes(false)
                .actif(true)
                .build());
        creerDepts(unigom, new String[][]{
                {"DROIT", "Faculté de Droit", "FACULTE"},
                {"INFO", "Informatique", "DEPARTEMENT"},
                {"MED", "Sciences de Santé", "FACULTE"}
        });

        // UNIKIS - Kisangani
        Universite unikis = universiteRepo.save(Universite.builder()
                .nom("Université de Kisangani")
                .code("UNIKIS")
                .ville("Kisangani")
                .email("info@unikis.ac.cd")
                .anneeFondation(1963)
                .fraisBase(300.0)
                .inscriptionsOuvertes(true)
                .actif(true)
                .build());
        creerDepts(unikis, new String[][]{
                {"SCI", "Faculté des Sciences", "FACULTE"},
                {"DROIT", "Faculté de Droit", "FACULTE"},
                {"AGRO", "Sciences Agronomiques", "FACULTE"}
        });
    }

    private void creerDepts(Universite uni, String[][] depts) {
        Faculte facultePrincipale = faculteRepo.save(Faculte.builder()
                .nom("Faculté principale")
                .code(uni.getCode() + "-MAIN")
                .universite(uni)
                .active(true)
                .build());

        for (String[] d : depts) {
            Departement.TypeDepartement type = Departement.TypeDepartement.valueOf(d[2]);
            Faculte faculte = facultePrincipale;
            if (type == Departement.TypeDepartement.FACULTE) {
                faculte = faculteRepo.save(Faculte.builder()
                        .nom(d[1])
                        .code(uni.getCode() + "-" + d[0])
                        .universite(uni)
                        .active(true)
                        .build());
            }
            departementRepo.save(Departement.builder()
                    .code(d[0])
                    .nom(d[1])
                    .type(type)
                    .faculte(faculte)
                    .universite(uni)
                    .actif(true)
                    .build());
        }
    }

    private void creerUtilisateursDeTest() {
        // Récupération dynamique des IDs d'université (après création)
        Long unikinId = getUniversiteIdByCode("UNIKIN");
        Long uniluId  = getUniversiteIdByCode("UNILU");
        Long unigomId = getUniversiteIdByCode("UNIGOM");
        Long unikisId = getUniversiteIdByCode("UNIKIS");

        // --- Comptes système ---
        List<Utilisateur> utilisateurs = Arrays.asList(
                // ADMIN_UNIVERSITE
                creerUtilisateur("ADMIN", "UNIKIN", "admin@unikin.cd", "Admin123!",
                        RoleEnum.ADMIN_UNIVERSITE, unikinId, null),
                creerUtilisateur("ADMIN", "UNILU", "admin@unilu.cd", "Admin123!",
                        RoleEnum.ADMIN_UNIVERSITE, uniluId, null),
                creerUtilisateur("ADMIN", "UNIGOM", "admin@unigom.cd", "Admin123!",
                        RoleEnum.ADMIN_UNIVERSITE, unigomId, null),
                creerUtilisateur("ADMIN", "UNIKIS", "admin@unikis.cd", "Admin123!",
                        RoleEnum.ADMIN_UNIVERSITE, unikisId, null),
                creerUtilisateur("ADMIN", "UPN", "admin@upn.cd", "Admin123!",
                        RoleEnum.ADMIN_UNIVERSITE, null, null), // UPN n'existe pas dans les universités créées, donc null

                // RECTEUR
                creerUtilisateur("Recteur", "UNIKIN", "recteur@unikin.cd", "Recteur123!",
                        RoleEnum.RECTEUR, unikinId, null),

                // DOYEN (corrigé)
                creerUtilisateur("Doyen", "UNIKIN", "doyen@unikin.cd", "Doyen123!",
                        RoleEnum.DOYEN, unikinId, null),

                // CHEF_DEPARTEMENT
                creerUtilisateur("Chef", "Département", "chef@unikin.cd", "Chef123!",
                        RoleEnum.CHEF_DEPARTEMENT, unikinId, null),

                // PROFESSEUR
                creerUtilisateur("MUTOMBO", "Professeur", "professeur@unikin.cd", "Prof123!",
                        RoleEnum.PROFESSEUR, unikinId, null),

                // SECRETAIRE_ACADEMIQUE
                creerUtilisateur("Secretaire", "Académique", "secretaire@unikin.cd", "Secretaire123!",
                        RoleEnum.SECRETAIRE_ACADEMIQUE, unikinId, null),

                // CAISSIER
                creerUtilisateur("CAISSE", "Agent", "caissier@unikin.cd", "Caisse123!",
                        RoleEnum.CAISSIER, unikinId, null),

                // AGENT (nouveau rôle)
                creerUtilisateur("AGENT", "Caisse", "agent@unikin.cd", "Agent123!",
                        RoleEnum.AGENT, unikinId, null),

                // COMPTABLE
                creerUtilisateur("Comptable", "UNIKIN", "comptable@unikin.cd", "Comptable123!",
                        RoleEnum.COMPTABLE, unikinId, null),

                // RH
                creerUtilisateur("RH", "UNIKIN", "rh@unikin.cd", "RH123456!",
                        RoleEnum.RH, unikinId, null),

                // BIBLIOTHECAIRE
                creerUtilisateur("Biblio", "UNIKIN", "bibliothecaire@unikin.cd", "Biblio123!",
                        RoleEnum.BIBLIOTHECAIRE, unikinId, null),

                // APPARITEUR
                creerUtilisateur("Appariteur", "UNIKIN", "appariteur@unikin.cd", "Appariteur123!",
                        RoleEnum.APPARITEUR, unikinId, null),

                // SERVICE_SOCIAL
                creerUtilisateur("Social", "UNIKIN", "social@unikin.cd", "Social123!",
                        RoleEnum.SERVICE_SOCIAL, unikinId, null),

                // ADMIN_SYSTEME (nouveau rôle)
                creerUtilisateur("SysAdmin", "Systeme", "sysadmin@genuc.cd", "Sysadmin123!",
                        RoleEnum.ADMIN_SYSTEME, null, null),

                // ÉTUDIANTS
                creerUtilisateur("TEST", "Etudiant", "etudiant@unikin.cd", "Etudiant123!",
                        RoleEnum.ETUDIANT, unikinId, 1L), // départementId 1 = DROIT
                creerUtilisateur("TEST", "Etudiant", "etudiant@test.cd", "Etudiant123!",
                        RoleEnum.ETUDIANT, null, null)
        );

        utilisateurRepository.saveAll(utilisateurs);
    }

    /**
     * Crée un utilisateur avec tous les champs nécessaires.
     */
    private Utilisateur creerUtilisateur(String nom, String prenom, String email,
                                         String plainPassword, RoleEnum role,
                                         Long universiteId, Long departementId) {
        String encoded = passwordEncoder.encode(plainPassword);

        return Utilisateur.builder()
                .nom(nom)
                .prenom(prenom)
                .email(email)
                .motDePasse(encoded)
                .role(role)
                .universiteId(universiteId)
                .departementId(departementId)
                .actif(true)
                .compteActive(true)   // Active directement le compte
                .build();
    }

    /**
     * Récupère l'ID d'une université à partir de son code.
     */
    private Long getUniversiteIdByCode(String code) {
        return universiteRepo.findByCode(code)
                .map(Universite::getId)
                .orElse(null);
    }
}