package cd.genuc.config;

import cd.genuc.model.RoleEnum;
import cd.genuc.model.Universite;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.UniversiteRepository;
import cd.genuc.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!prod")
@Order(3)  // Exécuté après DataInitializer (1) et PaiementDataInitializer (2)
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    // ⚠️ JEU DE DONNÉES DE DÉVELOPPEMENT — jamais en production.
    //
    // Les 18 comptes ci-dessous sont créés avec `actif=true` et des mots de passe ÉCRITS EN
    // DUR, publiés dans le README du dépôt (public). Sans le @Profile("!prod") ci-dessus,
    // un déploiement de production exposait un SUPER_ADMIN admin@genuc.cd dont le mot de
    // passe est connu de quiconque a lu le dépôt. DataInitializer et PaiementDataInitializer
    // portaient déjà cette garde ; celle-ci manquait.
    //
    // Pour amorcer un vrai environnement de production, créer le premier administrateur
    // hors de ce chemin (script SQL ponctuel ou endpoint d'amorçage protégé), pas ici.

    private final UtilisateurRepository utilisateurRepository;
    private final UniversiteRepository universiteRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Récupération dynamique des IDs d'université
        Long unikinId = getUniversiteIdByCode("UNIKIN");
        Long uniluId  = getUniversiteIdByCode("UNILU");
        Long unigomId = getUniversiteIdByCode("UNIGOM");
        Long upnId    = getUniversiteIdByCode("UPN");

        // --- SUPER ADMIN (pas d'université) ---
        createUserIfNotExists(
            "admin@genuc.cd",
            "Genuc2024!",
            RoleEnum.SUPER_ADMIN,
            "ADMIN", "Super",
            null, null
        );

        // --- ADMINS D'UNIVERSITÉ ---
        createUserIfNotExists(
            "admin@unikin.cd",
            "Admin123!",
            RoleEnum.ADMIN_UNIVERSITE,
            "ADMIN", "UNIKIN",
            unikinId, null
        );
        createUserIfNotExists(
            "admin@unilu.cd",
            "Admin123!",
            RoleEnum.ADMIN_UNIVERSITE,
            "ADMIN", "UNILU",
            uniluId, null
        );
        createUserIfNotExists(
            "admin@unigom.cd",
            "Admin123!",
            RoleEnum.ADMIN_UNIVERSITE,
            "ADMIN", "UNIGOM",
            unigomId, null
        );
        createUserIfNotExists(
            "admin@upn.cd",
            "Admin123!",
            RoleEnum.ADMIN_UNIVERSITE,
            "ADMIN", "UPN",
            upnId, null
        );

        // --- RECTEUR ---
        createUserIfNotExists(
            "recteur@unikin.cd",
            "Recteur123!",
            RoleEnum.RECTEUR,
            "Recteur", "UNIKIN",
            unikinId, null
        );

        // --- PROFESSEUR ---
        createUserIfNotExists(
            "professeur@unikin.cd",
            "Prof123!",
            RoleEnum.PROFESSEUR,
            "Prof", "UNIKIN",
            unikinId, null
        );

        // --- CHEF DE DÉPARTEMENT ---
        createUserIfNotExists(
            "chef@unikin.cd",
            "Chef123!",
            RoleEnum.CHEF_DEPARTEMENT,
            "Chef", "Département",
            unikinId, null
        );

        // --- DOYEN (corrigé avec le bon rôle) ---
        createUserIfNotExists(
            "doyen@unikin.cd",
            "Doyen123!",
            RoleEnum.DOYEN,
            "Doyen", "UNIKIN",
            unikinId, null
        );

        // --- CAISSIER ---
        createUserIfNotExists(
            "caissier@unikin.cd",
            "Caisse123!",
            RoleEnum.CAISSIER,
            "Caissier", "UNIKIN",
            unikinId, null
        );

        // --- BIBLIOTHÉCAIRE ---
        createUserIfNotExists(
            "bibliothecaire@unikin.cd",
            "Biblio123!",
            RoleEnum.BIBLIOTHECAIRE,
            "Biblio", "UNIKIN",
            unikinId, null
        );

        // --- ÉTUDIANT ---
        createUserIfNotExists(
            "etudiant@unikin.cd",
            "Etudiant123!",
            RoleEnum.ETUDIANT,
            "Etudiant", "UNIKIN",
            unikinId, 1L   // départementId fixe si nécessaire (sinon null)
        );

        // --- SECRÉTAIRE ACADÉMIQUE ---
        createUserIfNotExists(
            "secretaire@unikin.cd",
            "Secretaire123!",
            RoleEnum.SECRETAIRE_ACADEMIQUE,
            "Secretaire", "Académique",
            unikinId, null
        );

        // --- APPARITEUR ---
        createUserIfNotExists(
            "appariteur@unikin.cd",
            "Appariteur123!",
            RoleEnum.APPARITEUR,
            "Appariteur", "UNIKIN",
            unikinId, null
        );

        // --- RH ---
        createUserIfNotExists(
            "rh@unikin.cd",
            "RH123456!",
            RoleEnum.RH,
            "RH", "UNIKIN",
            unikinId, null
        );

        // --- COMPTABLE ---
        createUserIfNotExists(
            "comptable@unikin.cd",
            "Comptable123!",
            RoleEnum.COMPTABLE,
            "Comptable", "UNIKIN",
            unikinId, null
        );

        // --- SERVICE SOCIAL ---
        createUserIfNotExists(
            "social@unikin.cd",
            "Social123!",
            RoleEnum.SERVICE_SOCIAL,
            "Social", "UNIKIN",
            unikinId, null
        );

        log.info("📊 DataLoader terminé - Comptes par défaut disponibles");
    }

    /**
     * Récupère l'ID d'une université à partir de son code.
     * @param code le code de l'université (ex: "UNIKIN")
     * @return l'ID ou null si l'université n'existe pas
     */
    private Long getUniversiteIdByCode(String code) {
        return universiteRepository.findByCode(code)
                .map(Universite::getId)
                .orElse(null);
    }

    /**
     * Crée un utilisateur s'il n'existe pas déjà avec cet email.
     */
    private void createUserIfNotExists(String email, String rawPassword, RoleEnum role,
                                       String nom, String prenom,
                                       Long universiteId, Long departementId) {
        if (!utilisateurRepository.existsByEmail(email)) {
            Utilisateur utilisateur = Utilisateur.builder()
                .email(email)
                .motDePasse(passwordEncoder.encode(rawPassword))
                .nom(nom)
                .prenom(prenom)
                .role(role)
                .universiteId(universiteId)
                .departementId(departementId)
                .compteActive(true)
                .actif(true)
                .build();
            utilisateurRepository.save(utilisateur);
            log.info("✅ Compte créé : {} / {} avec rôle {}", email, rawPassword, role);
        } else {
            log.debug("ℹ️ Compte déjà existant : {}", email);
        }
    }
}