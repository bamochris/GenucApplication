package cd.genuc.config.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.Nullable;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Diffuse les invalidations de cache local aux autres instances du backend.
 *
 * <p>Fonctionne en « au mieux » : si Redis est indisponible, la diffusion échoue en silence
 * (log limité) et le TTL court du niveau 1 sert de filet. Une invalidation perdue ne peut
 * jamais faire échouer la requête HTTP en cours.</p>
 */
@Slf4j
public class PublicateurInvalidationCache {

    /** Identifiant de cette instance : sert à ignorer ses propres messages. */
    private final String noeud = UUID.randomUUID().toString();

    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;

    private final AtomicLong dernierAvertissement = new AtomicLong(0);
    private static final long INTERVALLE_LOG_MS = 60_000;

    public PublicateurInvalidationCache(StringRedisTemplate redis, ObjectMapper mapper) {
        this.redis = redis;
        this.mapper = mapper;
    }

    public String noeud() {
        return noeud;
    }

    /**
     * @param cache nom du cache concerné
     * @param cle   clé à invalider, ou {@code null} pour vider tout le cache
     */
    public void diffuser(String cache, @Nullable String cle) {
        try {
            String charge = mapper.writeValueAsString(new MessageInvalidationCache(noeud, cache, cle));
            redis.convertAndSend(MessageInvalidationCache.CANAL, charge);
        } catch (Exception e) {
            long maintenant = System.currentTimeMillis();
            long precedent = dernierAvertissement.get();
            if (maintenant - precedent > INTERVALLE_LOG_MS
                    && dernierAvertissement.compareAndSet(precedent, maintenant)) {
                log.warn("Diffusion d'invalidation de cache impossible ({}) — le cache local "
                        + "restera servi jusqu'à expiration de son TTL. {}", cache, e.getMessage());
            }
        }
    }
}
