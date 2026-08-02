package cd.genuc.service;

import cd.genuc.model.Universite;
import cd.genuc.model.Utilisateur;
import cd.genuc.model.RoleEnum;
import cd.genuc.repository.UniversiteRepository;
import cd.genuc.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SuperAdminService {

    private final UniversiteRepository universiteRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final StockageFichierService stockage;

    private final String UPLOAD_DIR = "uploads/logos/";

    @Transactional
    public Universite enregistrerUniversiteAvecAdmin(
            Universite universite,
            Utilisateur admin,
            List<String> facultes,
            List<String> departements,
            List<String> promotions,
            MultipartFile logo,
            MultipartFile sceau) {

        // 1. Vérifier l'unicité du code
        if (universiteRepository.findByCode(universite.getCode()).isPresent()) {
            throw new RuntimeException("Le code " + universite.getCode() + " est déjà utilisé.");
        }

        // 2. Vérifier l'unicité de l'email de l'admin
        if (utilisateurRepository.findByEmail(admin.getEmail()).isPresent()) {
            throw new RuntimeException("L'email " + admin.getEmail() + " est déjà utilisé.");
        }

        // 3. Gérer les fichiers
        try {
            if (logo != null && !logo.isEmpty()) {
                String logoPath = saveFile(logo, universite.getCode() + "_logo");
                universite.setLogo(logoPath);
            }
            if (sceau != null && !sceau.isEmpty()) {
                String sceauPath = saveFile(sceau, universite.getCode() + "_sceau");
                universite.setSceau(sceauPath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement des fichiers : " + e.getMessage());
        }

        // 4. Enregistrer les listes
        universite.setFacultes(facultes != null ? facultes : List.of());
        universite.setDepartements(departements != null ? departements : List.of());
        universite.setPromotions(promotions != null ? promotions : List.of());

        Universite savedUniv = universiteRepository.save(universite);

        // 5. Créer l'admin avec le rôle ADMIN_UNIVERSITE
        admin.setRole(RoleEnum.ADMIN_UNIVERSITE);
        admin.setMotDePasse(passwordEncoder.encode(admin.getPassword()));
        admin.setActif(true);
        admin.setCompteActive(true);
        admin.setUniversiteId(savedUniv.getId());

        utilisateurRepository.save(admin);

        log.info("✅ Université {} créée avec son admin {}", savedUniv.getCode(), admin.getEmail());

        return savedUniv;
    }

    /**
     * Logos et sceaux d'établissement : image seulement, nom généré côté serveur.
     * Le paramètre {@code baseName} n'entre plus dans le nom disque (il pouvait
     * contenir un code université arbitraire) ; il n'est conservé qu'en signature
     * pour ne pas modifier les appelants.
     */
    private String saveFile(MultipartFile file, String baseName) throws IOException {
        return stockage.enregistrer(file, "logos", StockageFichierService.Categorie.IMAGE).url();
    }
}