// src/main/java/cd/genuc/service/CacheService.java
package cd.genuc.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.function.Supplier;

/**
 * Accès programmatique au cache, pour les cas que les annotations ne couvrent pas
 * (clé connue seulement en cours de méthode, éviction croisée entre services…).
 *
 * <p><b>Toutes les opérations sont sans échec possible</b> : une panne Redis, une valeur
 * illisible ou un nom de cache inconnu se traduisent par un défaut de cache, jamais par une
 * exception remontée à l'appelant. Les annotations {@code @Cacheable} bénéficient déjà de
 * cette garantie via le {@code CacheErrorHandler} ; l'accès programmatique, lui, la
 * contournait — un simple {@code type.cast(...)} sur une entrée écrite par une version
 * antérieure du modèle suffisait à propager une {@code ClassCastException} jusqu'au
 * contrôleur.</p>
 */
@Service
@Slf4j
public class CacheService {

    private final CacheManager cacheManager;

    public CacheService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Récupère une valeur du cache. Renvoie {@link Optional#empty()} si l'entrée est absente,
     * illisible, d'un type inattendu, ou si le cache n'existe pas.
     */
    public <T> Optional<T> get(String cacheName, Object key, Class<T> type) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache == null) {
            return Optional.empty();
        }
        try {
            Cache.ValueWrapper wrapper = cache.get(key);
            if (wrapper == null) {
                return Optional.empty();
            }
            Object valeur = wrapper.get();
            if (valeur == null) {
                return Optional.empty();
            }
            if (!type.isInstance(valeur)) {
                // Entrée écrite par une version antérieure du modèle : on la jette.
                log.warn("Entrée de cache [{}] clé={} de type {} au lieu de {} : évincée",
                        cacheName, key, valeur.getClass().getName(), type.getName());
                evict(cacheName, key);
                return Optional.empty();
            }
            return Optional.of(type.cast(valeur));
        } catch (RuntimeException e) {
            log.warn("Lecture de cache [{}] clé={} en échec : {}", cacheName, key, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Lit la valeur en cache, ou l'obtient du fournisseur puis la mémorise.
     * Un {@code null} produit par le fournisseur n'est pas mis en cache.
     */
    public <T> T getOrLoad(String cacheName, Object key, Class<T> type, Supplier<T> fournisseur) {
        Optional<T> cachee = get(cacheName, key, type);
        if (cachee.isPresent()) {
            return cachee.get();
        }
        T valeur = fournisseur.get();
        if (valeur != null) {
            put(cacheName, key, valeur);
        }
        return valeur;
    }

    /** Stocke une valeur dans le cache. Sans effet si le cache n'existe pas. */
    public void put(String cacheName, Object key, Object value) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache == null || value == null) {
            return;
        }
        try {
            cache.put(key, value);
        } catch (RuntimeException e) {
            log.warn("Écriture de cache [{}] clé={} en échec : {}", cacheName, key, e.getMessage());
        }
    }

    /** Évince une entrée du cache. */
    public void evict(String cacheName, Object key) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache == null) {
            return;
        }
        try {
            cache.evict(key);
        } catch (RuntimeException e) {
            log.warn("Éviction de cache [{}] clé={} en échec : {}", cacheName, key, e.getMessage());
        }
    }

    /** Vide tout un cache. */
    public void clear(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache == null) {
            return;
        }
        try {
            cache.clear();
        } catch (RuntimeException e) {
            log.warn("Purge du cache [{}] en échec : {}", cacheName, e.getMessage());
        }
    }
}
