package cd.genuc.config.cache;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AssignableTypeFilter;
import org.springframework.util.ClassUtils;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Filet de sécurité du registre {@link CacheNames}.
 *
 * <p>Le gestionnaire Redis est configuré en {@code disableCreateOnMissingCache()} : un
 * {@code @Cacheable("typo")} ne crée plus silencieusement un cache fantôme, il échoue à
 * l'exécution. Ce test transforme cette panne potentielle en échec de build.</p>
 */
class DeclarationCachesTest {

    @Test
    @DisplayName("Tout nom de cache utilisé dans une annotation est déclaré dans CacheNames")
    void tousLesNomsSontDeclares() {
        Set<String> utilises = new TreeSet<>();

        var scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AssignableTypeFilter(Object.class));

        for (BeanDefinition definition : scanner.findCandidateComponents("cd.genuc")) {
            String nomClasse = definition.getBeanClassName();
            if (nomClasse == null) {
                continue;
            }
            Class<?> classe;
            try {
                classe = ClassUtils.forName(nomClasse, getClass().getClassLoader());
            } catch (Throwable e) {
                continue; // classe non chargeable dans le contexte de test : sans intérêt ici
            }
            for (Method methode : classe.getDeclaredMethods()) {
                collecter(methode.getAnnotation(Cacheable.class), utilises);
                collecter(methode.getAnnotation(CacheEvict.class), utilises);
                collecter(methode.getAnnotation(CachePut.class), utilises);

                Caching caching = methode.getAnnotation(Caching.class);
                if (caching != null) {
                    for (Cacheable a : caching.cacheable()) collecter(a, utilises);
                    for (CacheEvict a : caching.evict()) collecter(a, utilises);
                    for (CachePut a : caching.put()) collecter(a, utilises);
                }
            }
        }

        assertThat(utilises)
                .as("des annotations de cache ont été trouvées — sinon le test ne prouve rien")
                .isNotEmpty();

        assertThat(utilises)
                .as("noms de cache utilisés mais absents de CacheNames.DEFINITIONS")
                .allSatisfy(nom -> assertThat(CacheNames.PAR_NOM).containsKey(nom));
    }

    @Test
    @DisplayName("Chaque cache a un TTL strictement positif et un cache local correctement borné")
    void definitionsCoherentes() {
        for (CacheNames.Definition definition : CacheNames.DEFINITIONS) {
            assertThat(definition.ttl()).as(definition.nom() + " : TTL").isPositive();
            if (definition.cacheLocalAutorise()) {
                assertThat(definition.tailleMaxLocale())
                        .as(definition.nom() + " : taille du cache local")
                        .isPositive();
            }
        }
    }

    @Test
    @DisplayName("Aucune donnée nominative ou financière n'est éligible au cache local")
    void pasDeCacheLocalSurLesDonneesSensibles() {
        List<String> interdits = List.of(
                CacheNames.PROFIL_UTILISATEUR,
                CacheNames.NOTES,
                CacheNames.FRAIS_ETUDIANT,
                CacheNames.SITUATION_FINANCIERE,
                CacheNames.STATUT_PAIEMENT);

        for (String nom : interdits) {
            assertThat(CacheNames.PAR_NOM.get(nom))
                    .as("cache " + nom)
                    .isNotNull()
                    .satisfies(d -> assertThat(d.cacheLocalAutorise())
                            .as(nom + " ne doit pas être gardé en mémoire locale")
                            .isFalse());
        }
    }

    private static void collecter(Cacheable annotation, Set<String> cible) {
        if (annotation != null) {
            cible.addAll(List.of(annotation.value()));
            cible.addAll(List.of(annotation.cacheNames()));
        }
    }

    private static void collecter(CacheEvict annotation, Set<String> cible) {
        if (annotation != null) {
            cible.addAll(List.of(annotation.value()));
            cible.addAll(List.of(annotation.cacheNames()));
        }
    }

    private static void collecter(CachePut annotation, Set<String> cible) {
        if (annotation != null) {
            cible.addAll(List.of(annotation.value()));
            cible.addAll(List.of(annotation.cacheNames()));
        }
    }
}
