package cd.genuc.config.cache;

import com.github.benmanes.caffeine.cache.Caffeine;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.cache.CaffeineCacheMetrics;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.transaction.TransactionAwareCacheDecorator;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.time.Duration;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gestionnaire de caches GENUC : compose le cache Redis avec un niveau 1 en mémoire pour les
 * caches qui l'autorisent (voir {@link CacheNames}).
 *
 * <p>Les caches non éligibles au niveau 1 sont renvoyés tels quels : ce gestionnaire n'est
 * alors qu'un passe-plat, et la désactivation du niveau 1
 * ({@code genuc.cache.local.enabled=false}) rétablit exactement le comportement précédent.</p>
 *
 * <p>Chaque cache est enveloppé dans un {@link TransactionAwareCacheDecorator} : les écritures
 * et évictions ne sont appliquées qu'après le commit de la transaction. Sans cela, une
 * transaction annulée laisserait sa valeur en cache — ce que garantissait déjà l'option
 * {@code transactionAware()} du {@code RedisCacheManager}, et qu'il fallait donc reproduire
 * ici, au-dessus des deux niveaux.</p>
 */
@Slf4j
public class GestionnaireCacheDeuxNiveaux implements CacheManager {

    private final CacheManager delegue;
    private final PublicateurInvalidationCache publicateur;
    private final MeterRegistry registre;
    private final boolean niveau1Actif;
    private final Duration ttlNiveau1Max;

    /** Caches exposés (déjà enveloppés dans la décoration transactionnelle). */
    private final Map<String, Cache> caches = new ConcurrentHashMap<>();
    /** Vue directe sur les deux-niveaux, pour l'invalidation reçue du réseau et le suivi. */
    private final Map<String, CacheDeuxNiveaux> deuxNiveaux = new ConcurrentHashMap<>();

    public GestionnaireCacheDeuxNiveaux(CacheManager delegue,
                                        PublicateurInvalidationCache publicateur,
                                        MeterRegistry registre,
                                        boolean niveau1Actif,
                                        Duration ttlNiveau1Max) {
        this.delegue = delegue;
        this.publicateur = publicateur;
        this.registre = registre;
        this.niveau1Actif = niveau1Actif;
        this.ttlNiveau1Max = ttlNiveau1Max;
    }

    @Override
    @Nullable
    public Cache getCache(@NonNull String name) {
        Cache existant = caches.get(name);
        if (existant != null) {
            return existant;
        }
        return caches.computeIfAbsent(name, this::construire);
    }

    @Override
    @NonNull
    public Collection<String> getCacheNames() {
        return delegue.getCacheNames();
    }

    /** Applique une invalidation reçue d'une autre instance : niveau 1 uniquement. */
    public void invaliderNiveau1(String cache, @Nullable String cle) {
        CacheDeuxNiveaux cible = deuxNiveaux.get(cache);
        if (cible != null) {
            cible.invaliderLocalement(cle);
        }
    }

    /** Vue en lecture des caches locaux, pour l'endpoint d'administration. */
    public Map<String, CacheDeuxNiveaux> cachesLocaux() {
        return Map.copyOf(deuxNiveaux);
    }

    @Nullable
    private Cache construire(String name) {
        Cache redis = delegue.getCache(name);
        if (redis == null) {
            return null;
        }

        CacheNames.Definition definition = CacheNames.PAR_NOM.get(name);
        if (!niveau1Actif || definition == null || !definition.cacheLocalAutorise()) {
            return new TransactionAwareCacheDecorator(redis);
        }

        // Le TTL local est plafonné : même si le message d'invalidation se perd, une donnée
        // périmée ne peut pas survivre au-delà de cette fenêtre.
        Duration ttl = definition.ttl().compareTo(ttlNiveau1Max) < 0 ? definition.ttl() : ttlNiveau1Max;

        com.github.benmanes.caffeine.cache.Cache<String, Object> local = Caffeine.newBuilder()
                .maximumSize(definition.tailleMaxLocale())
                .expireAfterWrite(ttl)
                .recordStats()
                .build();

        if (registre != null) {
            CaffeineCacheMetrics.monitor(registre, local, "genuc_cache_local",
                    java.util.List.of(io.micrometer.core.instrument.Tag.of("cache", name)));
        }

        CacheDeuxNiveaux compose = new CacheDeuxNiveaux(name, local, redis, publicateur);
        deuxNiveaux.put(name, compose);
        log.debug("Cache « {} » : niveau 1 actif (max {} entrées, TTL {})",
                name, definition.tailleMaxLocale(), ttl);
        return new TransactionAwareCacheDecorator(compose);
    }
}
