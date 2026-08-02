package cd.genuc.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.security.web.header.HeaderWriter;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

import java.util.List;

/**
 * Cache HTTP : le niveau qui évite l'appel réseau lui-même.
 *
 * <p>Aucun en-tête {@code Cache-Control} n'était émis. Spring Security en pose un par défaut
 * sur toutes les réponses, mais {@code SecurityConfig} le désactivait explicitement
 * ({@code .cacheControl(cache -> cache.disable())}) sans rien mettre à la place. Deux
 * conséquences opposées, toutes deux problématiques :</p>
 * <ul>
 *   <li><b>Sécurité.</b> Sans directive, un navigateur (et tout proxy intermédiaire) est libre
 *       d'écrire les réponses sur disque selon ses heuristiques. Des relevés de notes, des
 *       situations financières ou des données d'identité pouvaient donc rester dans le cache
 *       d'un poste partagé — cybercafé, salle informatique, poste de guichet — et être relus
 *       par la personne suivante avec un simple retour arrière. Tout ce qui n'est pas
 *       explicitement public est désormais marqué {@code no-store}.</li>
 *   <li><b>Charge.</b> À l'inverse, les données de référence réellement publiques (liste des
 *       établissements, filières, offres) étaient redemandées à chaque navigation. Elles
 *       reçoivent maintenant un {@code max-age} court et un ETag : le navigateur ne rappelle
 *       plus le backend pendant la fraîcheur, puis se contente d'un 304 sans corps.</li>
 * </ul>
 *
 * <p><b>Pourquoi un {@link HeaderWriter} et pas un filtre.</b> Un filtre qui pose l'en-tête
 * <i>après</i> la chaîne arrive trop tard dès que la réponse dépasse la taille du tampon
 * (quelques kilo-octets) : elle est déjà committée et l'en-tête est ignoré en silence — donc
 * précisément absent sur les grosses réponses, celles qui contiennent le plus de données.
 * Spring Security enveloppe la réponse et déclenche l'écriture juste avant le commit, ce qui
 * règle le problème et évite d'empiler deux mécanismes concurrents.</p>
 */
@Slf4j
@Configuration
public class HttpCacheConfig {

    /**
     * Ressources publiques en lecture seule, sûres à mettre en cache côté client et proxy.
     * N'ajouter ici qu'un chemin dont la réponse est <b>identique pour tout le monde</b> :
     * une ressource dont le contenu dépend de l'utilisateur connecté n'a rien à y faire.
     */
    static final List<String> CHEMINS_PUBLICS = List.of(
            "/api/universites/public",
            "/api/departements/public",
            "/api/filieres/public",
            "/api/cours/public",
            "/api/annees-academiques/public",
            "/api/palmares/public",
            "/api/emploi-universitaire/offres/publiques",
            "/api/emploi/offres/publiques"
    );

    static final String CACHE_PUBLIC = "public, max-age=60, stale-while-revalidate=300";
    static final String PAS_DE_STOCKAGE = "no-store, no-cache, must-revalidate, private";

    static boolean estPublic(String chemin) {
        if (chemin == null) {
            return false;
        }
        return CHEMINS_PUBLICS.stream()
                .anyMatch(prefixe -> chemin.equals(prefixe) || chemin.startsWith(prefixe + "/"));
    }

    /** Branché sur la chaîne de filtres de sécurité — voir {@code SecurityConfig}. */
    @Bean
    public HeaderWriter ecrivainCacheControl() {
        return new CacheControlHeaderWriter();
    }

    /**
     * ETag sur les seules ressources publiques : un 304 économise le corps de la réponse.
     *
     * <p>Volontairement <b>pas</b> appliqué à tout {@code /api/**} : ce filtre met la réponse
     * entière en tampon mémoire pour en calculer l'empreinte, ce qui serait ruineux sur les
     * endpoints qui diffusent des PDF (reçus, bons de caisse, relevés).</p>
     */
    @Bean
    public FilterRegistrationBean<ShallowEtagHeaderFilter> filtreEtag() {
        FilterRegistrationBean<ShallowEtagHeaderFilter> enregistrement =
                new FilterRegistrationBean<>(new ShallowEtagHeaderFilter());
        CHEMINS_PUBLICS.forEach(chemin -> {
            enregistrement.addUrlPatterns(chemin);
            enregistrement.addUrlPatterns(chemin + "/*");
        });
        enregistrement.setOrder(Ordered.LOWEST_PRECEDENCE - 11);
        return enregistrement;
    }

    /** Applique la directive de cache adaptée à chaque réponse. */
    public static class CacheControlHeaderWriter implements HeaderWriter {

        @Override
        public void writeHeaders(HttpServletRequest requete, HttpServletResponse reponse) {
            // Un contrôleur qui a posé sa propre directive sait mieux que nous
            // (téléchargements de fichiers signés, réponses à durée de vie particulière).
            if (reponse.getHeader(HttpHeaders.CACHE_CONTROL) != null) {
                return;
            }

            String methode = requete.getMethod();
            boolean lecture = "GET".equalsIgnoreCase(methode) || "HEAD".equalsIgnoreCase(methode);

            if (lecture && estPublic(requete.getRequestURI())) {
                reponse.setHeader(HttpHeaders.CACHE_CONTROL, CACHE_PUBLIC);
                reponse.addHeader(HttpHeaders.VARY, HttpHeaders.ACCEPT_ENCODING);
            } else {
                reponse.setHeader(HttpHeaders.CACHE_CONTROL, PAS_DE_STOCKAGE);
                reponse.setHeader(HttpHeaders.PRAGMA, "no-cache");
                reponse.setHeader(HttpHeaders.EXPIRES, "0");
            }
        }
    }
}
