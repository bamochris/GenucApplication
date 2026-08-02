package cd.genuc.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Directives de cache HTTP.
 *
 * <p>L'enjeu principal est la première assertion : sans {@code no-store}, un relevé de notes
 * ou une situation financière peut rester dans le cache disque d'un poste partagé.</p>
 */
class HttpCacheConfigTest {

    private final HttpCacheConfig.CacheControlHeaderWriter ecrivain =
            new HttpCacheConfig.CacheControlHeaderWriter();

    private MockHttpServletResponse ecrire(String methode, String chemin) {
        MockHttpServletRequest requete = new MockHttpServletRequest(methode, chemin);
        MockHttpServletResponse reponse = new MockHttpServletResponse();
        ecrivain.writeHeaders(requete, reponse);
        return reponse;
    }

    @Test
    @DisplayName("Une réponse authentifiée n'est jamais stockée par le navigateur")
    void donneesPriveesNonStockees() {
        MockHttpServletResponse reponse = ecrire("GET", "/api/etudiant/notes");

        assertThat(reponse.getHeader(HttpHeaders.CACHE_CONTROL)).contains("no-store");
        assertThat(reponse.getHeader(HttpHeaders.PRAGMA)).isEqualTo("no-cache");
        assertThat(reponse.getHeader(HttpHeaders.EXPIRES)).isEqualTo("0");
    }

    @Test
    @DisplayName("Les ressources publiques de référence sont cachables un court instant")
    void referencePubliqueCachable() {
        MockHttpServletResponse reponse = ecrire("GET", "/api/universites/public");

        assertThat(reponse.getHeader(HttpHeaders.CACHE_CONTROL))
                .isEqualTo("public, max-age=60, stale-while-revalidate=300");
        assertThat(reponse.getHeader(HttpHeaders.VARY)).isEqualTo(HttpHeaders.ACCEPT_ENCODING);
    }

    @Test
    @DisplayName("Une écriture n'est jamais cachable, même sur un chemin public")
    void ecritureJamaisCachable() {
        MockHttpServletResponse reponse = ecrire("POST", "/api/universites/public");

        assertThat(reponse.getHeader(HttpHeaders.CACHE_CONTROL)).contains("no-store");
    }

    @Test
    @DisplayName("Un chemin qui ressemble à un chemin public sans l'être reste privé")
    void pasDeCorrespondancePartielle() {
        assertThat(HttpCacheConfig.estPublic("/api/universites/public")).isTrue();
        assertThat(HttpCacheConfig.estPublic("/api/universites/public/42")).isTrue();
        assertThat(HttpCacheConfig.estPublic("/api/universites/publications-privees")).isFalse();
        assertThat(HttpCacheConfig.estPublic("/api/universites")).isFalse();
        assertThat(HttpCacheConfig.estPublic(null)).isFalse();
    }

    @Test
    @DisplayName("Une directive posée par le contrôleur n'est pas écrasée")
    void directiveExistantePreservee() {
        MockHttpServletRequest requete = new MockHttpServletRequest("GET", "/api/fichiers/42");
        MockHttpServletResponse reponse = new MockHttpServletResponse();
        // Ce que fait FichierController sur un téléchargement contrôlé.
        reponse.setHeader(HttpHeaders.CACHE_CONTROL, "private, max-age=0, no-store");

        ecrivain.writeHeaders(requete, reponse);

        assertThat(reponse.getHeader(HttpHeaders.CACHE_CONTROL)).isEqualTo("private, max-age=0, no-store");
    }

    @Test
    @DisplayName("Aucun chemin de la liste blanche ne dépend de l'utilisateur connecté")
    void listeBlancheUniquementPublique() {
        // Garde-fou de revue : toute entrée doit contenir un marqueur explicite de publicité.
        assertThat(HttpCacheConfig.CHEMINS_PUBLICS)
                .allSatisfy(chemin -> assertThat(chemin)
                        .as("chemin mis en cache partagé sans marqueur public : " + chemin)
                        .matches(".*/(public|publiques)$"));
    }
}
