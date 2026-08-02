package cd.genuc.config;

import cd.genuc.service.FichierAccesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration des ressources statiques.
 *
 * <p>Ce handler ne sert QUE les sous-dossiers d'identité visuelle
 * ({@link FichierAccesService#DOSSIERS_PUBLICS}) : logos, sceaux et certificats de
 * palmarès, affichés par des pages publiques où un {@code <img src>} ne peut pas
 * transmettre de jeton JWT.</p>
 *
 * <p>Auparavant, {@code /uploads/**} exposait la totalité du dossier, y compris
 * {@code uploads/dossiers/} (actes de naissance, cartes d'identité, diplômes des
 * candidats) et {@code uploads/photos/} (photos passeport) : l'URL suffisait, aucun
 * compte n'était nécessaire. Ces fichiers sont maintenant servis exclusivement par
 * {@code cd.genuc.controller.FichierController}, après contrôle de propriété.</p>
 *
 * <p><b>Conséquence pour le code métier</b> : tout nouveau fichier contenant une
 * donnée personnelle doit être écrit dans un sous-dossier absent de
 * {@code DOSSIERS_PUBLICS} — sans quoi il redevient lisible sans authentification.</p>
 */
@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        for (String dossier : FichierAccesService.DOSSIERS_PUBLICS) {
            registry.addResourceHandler("/uploads/" + dossier + "/**")
                    .addResourceLocations("file:uploads/" + dossier + "/")
                    .setCachePeriod(3600); // 1h de cache navigateur
        }

        log.info("✅ WebConfig chargée : seuls les dossiers publics {} sont servis sous /uploads/** "
                + "(le reste passe par /api/fichiers/** avec contrôle d'accès).",
                FichierAccesService.DOSSIERS_PUBLICS);
    }
}
