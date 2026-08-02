package cd.genuc.controller;

import cd.genuc.config.cache.CacheDeuxNiveaux;
import cd.genuc.config.cache.CacheNames;
import cd.genuc.config.cache.GestionnaireCacheDeuxNiveaux;
import cd.genuc.dto.ApiResponse;
import com.github.benmanes.caffeine.cache.stats.CacheStats;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Exploitation du cache : état et purge manuelle.
 *
 * <p>Réservé au SUPER_ADMIN. L'API expose délibérément des <b>compteurs agrégés</b> et jamais
 * de clés ni de valeurs : la liste des clés d'un cache trahirait, à elle seule, quels
 * étudiants et quels dossiers ont été consultés récemment.</p>
 *
 * <p>La purge n'accepte que les noms déclarés dans {@link CacheNames} : un nom arbitraire ne
 * peut donc pas servir à vider une autre partie de l'espace de clés Redis (le rate limiter,
 * par exemple, ou une application voisine sur la même instance).</p>
 */
@RestController
@RequestMapping("/api/admin/cache")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Slf4j
@Tag(name = "Cache", description = "Supervision et purge du cache applicatif")
public class CacheAdminController {

    private final GestionnaireCacheDeuxNiveaux gestionnaire;

    @GetMapping
    @Operation(summary = "État des caches",
               description = "TTL configuré, activation du cache local et statistiques d'utilisation")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> etat() {
        Map<String, CacheDeuxNiveaux> locaux = gestionnaire.cachesLocaux();
        List<Map<String, Object>> etats = new ArrayList<>();

        for (CacheNames.Definition definition : CacheNames.DEFINITIONS) {
            Map<String, Object> ligne = new LinkedHashMap<>();
            ligne.put("nom", definition.nom());
            ligne.put("ttlSecondes", definition.ttl().toSeconds());
            ligne.put("cacheLocalAutorise", definition.cacheLocalAutorise());

            CacheDeuxNiveaux local = locaux.get(definition.nom());
            if (local == null) {
                ligne.put("cacheLocalActif", false);
            } else {
                CacheStats stats = local.niveau1().stats();
                ligne.put("cacheLocalActif", true);
                ligne.put("entreesLocales", local.tailleNiveau1());
                ligne.put("succesLocaux", stats.hitCount());
                ligne.put("defautsLocaux", stats.missCount());
                ligne.put("tauxSuccesLocal", Math.round(stats.hitRate() * 1000) / 10.0);
                ligne.put("evictionsLocales", stats.evictionCount());
            }
            etats.add(ligne);
        }
        return ResponseEntity.ok(ApiResponse.ok(etats));
    }

    @DeleteMapping("/{nom}")
    @Operation(summary = "Purger un cache", description = "Vide les deux niveaux et prévient les autres instances")
    public ResponseEntity<?> purger(@PathVariable String nom) {
        if (!CacheNames.PAR_NOM.containsKey(nom)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("CACHE_INCONNU",
                            "Aucun cache déclaré sous le nom « " + nom + " ».",
                            HttpStatus.NOT_FOUND.value()));
        }
        Cache cache = gestionnaire.getCache(nom);
        if (cache != null) {
            cache.clear();
        }
        log.info("Cache « {} » purgé manuellement par un SUPER_ADMIN", nom);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("cache", nom, "purge", true)));
    }

    @DeleteMapping
    @Operation(summary = "Purger tous les caches")
    public ResponseEntity<ApiResponse<Map<String, Object>>> purgerTout() {
        for (String nom : CacheNames.tousLesNoms()) {
            Cache cache = gestionnaire.getCache(nom);
            if (cache != null) {
                cache.clear();
            }
        }
        log.warn("Purge COMPLÈTE du cache déclenchée manuellement par un SUPER_ADMIN");
        return ResponseEntity.ok(ApiResponse.ok(
                Map.of("caches", CacheNames.tousLesNoms().size(), "purge", true)));
    }
}
