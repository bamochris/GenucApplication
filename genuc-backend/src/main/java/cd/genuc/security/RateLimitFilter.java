package cd.genuc.security;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Rate limiter distribué via Redis — fonctionne avec plusieurs instances backend.
 * Algorithme : sliding window counter via script Lua atomique.
 * Limites configurables : genuc.ratelimit.api-per-minute (défaut 300, la SPA fait
 * beaucoup d'appels parallèles) et genuc.ratelimit.login-per-minute (défaut 20,
 * strict pour la protection anti-brute-force).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redis;
    private final MeterRegistry meterRegistry;
    private final ResolveurIpClient resolveurIp;

    @Value("${genuc.ratelimit.api-per-minute:300}")
    private int maxRequestsApi;

    @Value("${genuc.ratelimit.login-per-minute:20}")
    private int maxRequestsLogin;

    @Value("${genuc.ratelimit.tachpay-public-per-minute:60}")
    private int maxRequestsTachPayPublic;

    private static final int WINDOW_SECONDS     = 60;

    // Limite le log Redis à 1 fois par minute pour éviter le bruit
    private static final AtomicLong lastRedisWarnAt = new AtomicLong(0);
    private static final long REDIS_LOG_THROTTLE_MS = 60_000;

    // Métriques exportées vers Prometheus (/actuator/prometheus) — alertables.
    // Un fail-open (Redis down) fait grimper genuc_ratelimit_redis_unavailable_total :
    // le rate limiting est alors DÉSACTIVÉ, une alerte doit se déclencher.
    private Counter redisIndisponibleCounter;
    private Counter depassementCounter;

    @PostConstruct
    void initMetriques() {
        redisIndisponibleCounter = Counter.builder("genuc.ratelimit.redis_unavailable")
            .description("Requêtes passées en fail-open car Redis était indisponible (rate limiting désactivé)")
            .register(meterRegistry);
        depassementCounter = Counter.builder("genuc.ratelimit.exceeded")
            .description("Requêtes rejetées (HTTP 429) pour dépassement du rate limit")
            .register(meterRegistry);
    }

    // Script Lua atomique : INCR + EXPIRE en une seule opération Redis
    private static final DefaultRedisScript<Long> RATE_LIMIT_SCRIPT =
        new DefaultRedisScript<>("""
            local count = redis.call('INCR', KEYS[1])
            if count == 1 then
                redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return count
            """, Long.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String ip    = resolveurIp.resoudre(request);
        String path  = request.getRequestURI();
        boolean isLogin = estRouteAuthSensible(path);
        boolean isTachPayPublic = estRouteTachPayPublic(path);

        int limit;
        String prefix;
        if (isLogin) {
            limit = maxRequestsLogin;
            prefix = "login:";
        } else if (isTachPayPublic) {
            limit = maxRequestsTachPayPublic;
            prefix = "tachpay-public:";
        } else {
            limit = maxRequestsApi;
            prefix = "api:";
        }

        String key = "rl:" + prefix + ip;

        try {
            Long count = redis.execute(RATE_LIMIT_SCRIPT,
                    List.of(key),
                    String.valueOf(WINDOW_SECONDS));

            if (count == null) {
                chain.doFilter(request, response);
                return;
            }

            int remaining = (int) Math.max(0, limit - count);
            response.setHeader("X-RateLimit-Limit",     String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));

            if (count > limit) {
                depassementCounter.increment();
                log.warn("Rate limit dépassé pour IP={} path={} count={}", ip, path, count);
                response.setStatus(429);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                    "{\"erreur\":\"Trop de requêtes. Réessayez dans une minute.\",\"code\":429}");
                return;
            }

        } catch (Exception e) {
            // Si Redis est indisponible → fail-open, log throttlé à 1/min + métrique alertable
            redisIndisponibleCounter.increment();
            long now = System.currentTimeMillis();
            long last = lastRedisWarnAt.get();
            if (now - last > REDIS_LOG_THROTTLE_MS && lastRedisWarnAt.compareAndSet(last, now)) {
                log.warn("RateLimitFilter: Redis indisponible, requêtes autorisées sans limite. {}", e.getMessage());
            }
        }

        chain.doFilter(request, response);
    }

    /**
     * Routes soumises à la limite stricte (anti-bruteforce).
     *
     * <p>L'ancienne détection cherchait {@code "/auth/login"} ou {@code "/auth/register"}
     * dans le chemin. Or l'endpoint de connexion réellement utilisé par le frontend est
     * {@code /api/auth/connecter} (voir {@code AuthController}) : il ne contenait aucune
     * de ces deux chaînes et bénéficiait donc de la limite API large (300/min au lieu
     * de 20/min). La route principale de connexion était, en pratique, non protégée.</p>
     *
     * <p>{@code /api/auth/refresh} est volontairement EXCLU : plusieurs onglets peuvent
     * déclencher un rafraîchissement simultané après expiration du jeton, et une limite
     * de 20/min déconnecterait des utilisateurs légitimes.</p>
     */
    private static final List<String> ROUTES_AUTH_SENSIBLES = List.of(
            "/api/auth/connecter",
            "/api/auth/login",
            "/api/auth/inscrire",
            "/api/auth/register",
            "/api/auth/mot-de-passe-oublie",
            "/api/auth/2fa/login-verify");

    private static final List<String> ROUTES_TACHPAY_PUBLIC = List.of(
            "/api/tachpay/public",
            "/api/tachpay/etudiant/checkout-context");

    private boolean estRouteAuthSensible(String path) {
        if (path == null) {
            return false;
        }
        // Comparaison insensible à la casse et tolérante à un slash final, sans
        // startsWith global : /api/auth/logout ne doit pas hériter de la limite stricte.
        String normalise = path.toLowerCase(java.util.Locale.ROOT);
        if (normalise.length() > 1 && normalise.endsWith("/")) {
            normalise = normalise.substring(0, normalise.length() - 1);
        }
        return ROUTES_AUTH_SENSIBLES.contains(normalise);
    }

    /**
     * Routes TachPay publiques (accessibles sans authentification).
     * Limitées à 60 req/min par IP pour prévenir le spam et les abus
     * sur les endpoints de paiement.
     */
    private boolean estRouteTachPayPublic(String path) {
        if (path == null) {
            return false;
        }
        String normalise = path.toLowerCase(java.util.Locale.ROOT);
        if (normalise.length() > 1 && normalise.endsWith("/")) {
            normalise = normalise.substring(0, normalise.length() - 1);
        }
        return ROUTES_TACHPAY_PUBLIC.stream().anyMatch(normalise::startsWith);
    }
}
