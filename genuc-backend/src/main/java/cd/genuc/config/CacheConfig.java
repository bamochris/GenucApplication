package cd.genuc.config;

import cd.genuc.config.cache.CacheNames;
import cd.genuc.config.cache.EcouteurInvalidationCache;
import cd.genuc.config.cache.GestionnaireCacheDeuxNiveaux;
import cd.genuc.config.cache.MessageInvalidationCache;
import cd.genuc.config.cache.ModuleJacksonHibernate;
import cd.genuc.config.cache.PublicateurInvalidationCache;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.SimpleCacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
@Slf4j
public class CacheConfig implements CachingConfigurer {

    /**
     * Préfixe de toutes les clés de cache. Aligné sur {@code spring.cache.redis.key-prefix} :
     * cette propriété n'a aucun effet dès lors qu'un {@code RedisCacheManager} est déclaré à
     * la main, et les deux valeurs avaient divergé — les clés réelles étaient {@code genuc:…}
     * et non {@code genuc:cache:…}. Un même Redis pouvant héberger d'autres applications (et
     * le rate limiter, préfixe {@code rl:}), le préfixe sert aussi à cloisonner les purges.
     */
    private static final String PREFIXE_CLE = "genuc:cache:";

    /** Résolu paresseusement : le CachingConfigurer est initialisé très tôt. */
    private final ObjectProvider<MeterRegistry> registres;

    private volatile Counter erreursCache;

    @Value("${genuc.cache.local.enabled:true}")
    private boolean cacheLocalActif;

    /**
     * Plafond du TTL en mémoire. Borne la fenêtre d'obsolescence si un message
     * d'invalidation se perd (Redis momentanément indisponible).
     */
    @Value("${genuc.cache.local.ttl-max-seconds:120}")
    private long ttlLocalMaxSecondes;

    public CacheConfig(ObjectProvider<MeterRegistry> registres) {
        this.registres = registres;
    }

    // ════════════════════════════════════════════════════════════════════
    //  Sérialisation
    // ════════════════════════════════════════════════════════════════════

    /**
     * Liste blanche des types acceptés à la relecture d'une valeur cachée.
     *
     * <p><b>Pourquoi ce n'est pas cosmétique.</b> La configuration précédente utilisait
     * {@code LaissezFaireSubTypeValidator}, qui — comme son nom l'indique — accepte
     * <i>n'importe quelle</i> classe nommée dans le {@code @class} d'une valeur JSON.
     * Combiné au typage polymorphique, c'est le schéma d'exécution de code à distance
     * classique de Jackson : quiconque peut écrire une clé {@code genuc:cache:*} dans Redis
     * (Redis exposé sans mot de passe, accès au réseau interne, instance mutualisée, dump
     * restauré) fait instancier par le backend la classe de son choix parmi celles du
     * classpath, avec les valeurs de son choix. Restreindre aux paquets du domaine et aux
     * types JDK de base retire ce levier : une valeur empoisonnée est refusée à la
     * désérialisation, et le {@link #errorHandler()} la traite comme un simple défaut de
     * cache — la requête aboutit, en lisant la base.</p>
     */
    public static PolymorphicTypeValidator validateurTypes() {
        return BasicPolymorphicTypeValidator.builder()
                .allowIfSubType("cd.genuc.")
                .allowIfSubType("java.util.")
                .allowIfSubType("java.time.")
                .allowIfSubType("java.lang.")
                .allowIfSubType("java.math.")
                .build();
    }

    /** ObjectMapper dédié au cache — distinct de celui de Spring MVC. */
    public static ObjectMapper mapperCache() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        // Rend les entités JPA relisibles depuis Redis (collections et proxies Hibernate).
        mapper.registerModule(new ModuleJacksonHibernate());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // Un champ ajouté au modèle ne doit pas rendre illisibles les entrées écrites avant :
        // sans cela, chaque déploiement ferait échouer toutes les lectures jusqu'à expiration.
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        mapper.activateDefaultTyping(
                validateurTypes(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);
        return mapper;
    }

    @Bean
    public GenericJackson2JsonRedisSerializer redisJsonSerializer() {
        return new GenericJackson2JsonRedisSerializer(mapperCache());
    }

    // ════════════════════════════════════════════════════════════════════
    //  Gestionnaire de cache
    // ════════════════════════════════════════════════════════════════════

    public static RedisCacheConfiguration configurationParDefaut(
            GenericJackson2JsonRedisSerializer serialiseur) {
        return RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(serialiseur))
                .disableCachingNullValues()
                .prefixCacheNameWith(PREFIXE_CLE);
    }

    @Bean
    public RedisCacheManager gestionnaireCacheRedis(RedisConnectionFactory factory,
                                                    GenericJackson2JsonRedisSerializer redisJsonSerializer) {
        RedisCacheConfiguration defauts = configurationParDefaut(redisJsonSerializer);

        // Tous les caches sont déclarés dans CacheNames, avec un TTL explicite : les quatre
        // caches qui manquaient à l'ancienne table (parametres, parametresLMD, filiereDetails,
        // frais) tombaient sur le TTL par défaut sans que ce soit visible nulle part.
        Map<String, RedisCacheConfiguration> ttls = new LinkedHashMap<>();
        for (CacheNames.Definition definition : CacheNames.DEFINITIONS) {
            ttls.put(definition.nom(), defauts.entryTtl(definition.ttl()));
        }

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defauts.entryTtl(Duration.ofMinutes(10)))
                .withInitialCacheConfigurations(ttls)
                // Un @Cacheable dont le nom n'est pas déclaré dans CacheNames échoue au lieu
                // de créer en silence un cache au TTL par défaut que personne ne surveille.
                .disableCreateOnMissingCache()
                // La décoration transactionnelle est appliquée par le gestionnaire à deux
                // niveaux, au-dessus des deux couches (cf. GestionnaireCacheDeuxNiveaux).
                .build();
    }

    @Bean
    public PublicateurInvalidationCache publicateurInvalidationCache(StringRedisTemplate redis) {
        // Mapper minimal et NON polymorphique : le message d'invalidation est un record figé.
        return new PublicateurInvalidationCache(redis, new ObjectMapper());
    }

    /**
     * Gestionnaire exposé à Spring Cache : Redis, plus un niveau 1 en mémoire pour les caches
     * de référence. {@code genuc.cache.local.enabled=false} le réduit à un passe-plat vers
     * Redis, ce qui rétablit exactement le comportement antérieur sans redéploiement de code.
     */
    @Bean("cacheManager")
    @Primary
    public GestionnaireCacheDeuxNiveaux gestionnaireCache(RedisCacheManager gestionnaireCacheRedis,
                                                          PublicateurInvalidationCache publicateur,
                                                          MeterRegistry registre) {
        log.info("Cache GENUC : {} caches déclarés, niveau 1 en mémoire {} (TTL local plafonné à {}s)",
                CacheNames.DEFINITIONS.size(),
                cacheLocalActif ? "ACTIF" : "désactivé",
                ttlLocalMaxSecondes);
        return new GestionnaireCacheDeuxNiveaux(gestionnaireCacheRedis, publicateur, registre,
                cacheLocalActif, Duration.ofSeconds(ttlLocalMaxSecondes));
    }

    @Bean
    public RedisMessageListenerContainer conteneurInvalidationCache(
            RedisConnectionFactory factory,
            GestionnaireCacheDeuxNiveaux cacheManager,
            PublicateurInvalidationCache publicateur) {

        RedisMessageListenerContainer conteneur = new RedisMessageListenerContainer();
        conteneur.setConnectionFactory(factory);
        conteneur.addMessageListener(
                new EcouteurInvalidationCache(cacheManager, publicateur, new ObjectMapper()),
                new ChannelTopic(MessageInvalidationCache.CANAL));
        return conteneur;
    }

    // ════════════════════════════════════════════════════════════════════
    //  Tolérance aux pannes
    // ════════════════════════════════════════════════════════════════════

    /**
     * Fail-open : si Redis est indisponible (panne réseau, redémarrage) ou si une valeur est
     * illisible, les erreurs de cache sont loguées mais ne font pas échouer la requête HTTP.
     * La méthode est appelée normalement et lit directement en base — dégradé gracieux.
     *
     * <p>Une valeur illisible est en plus <b>évincée</b> : sans cela, une entrée corrompue —
     * ou refusée par la liste blanche de types — resterait à provoquer un aller-retour Redis
     * inutile devant chaque lecture, jusqu'à expiration de son TTL.</p>
     */
    @Override
    public CacheErrorHandler errorHandler() {
        return new SimpleCacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException e, Cache cache, Object key) {
                compter();
                log.warn("Cache GET échoué [{}] key={} : {}", cache.getName(), key, e.getMessage());
                try {
                    cache.evict(key);
                } catch (RuntimeException ignore) {
                    // Redis est probablement injoignable : rien de plus à tenter.
                }
            }

            @Override
            public void handleCachePutError(RuntimeException e, Cache cache, Object key, Object value) {
                compter();
                log.warn("Cache PUT échoué [{}] key={} : {}", cache.getName(), key, e.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException e, Cache cache, Object key) {
                compter();
                log.warn("Cache EVICT échoué [{}] key={} : {}", cache.getName(), key, e.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException e, Cache cache) {
                compter();
                log.warn("Cache CLEAR échoué [{}] : {}", cache.getName(), e.getMessage());
            }
        };
    }

    private void compter() {
        if (erreursCache == null) {
            MeterRegistry registre = registres.getIfAvailable();
            if (registre == null) {
                return;
            }
            erreursCache = Counter.builder("genuc.cache.errors")
                    .description("Opérations de cache en échec (Redis indisponible, valeur illisible)")
                    .register(registre);
        }
        erreursCache.increment();
    }
}
