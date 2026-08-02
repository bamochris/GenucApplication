package cd.genuc.security;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    @Mock private StringRedisTemplate redis;
    @Mock private FilterChain filterChain;

    private RateLimitFilter rateLimitFilter;

    private ResolveurIpClient resolveurIp;

    @BeforeEach
    void setUp() {
        // Proxy de confiance : 127.0.0.1 uniquement (l'adresse par défaut de
        // MockHttpServletRequest), pour pouvoir tester les deux cas de figure.
        resolveurIp = new ResolveurIpClient();
        ReflectionTestUtils.setField(resolveurIp, "proxiesDeConfiance", "127.0.0.1/32");
        resolveurIp.initialiser(); // @PostConstruct non déclenché hors Spring

        rateLimitFilter = new RateLimitFilter(redis, new SimpleMeterRegistry(), resolveurIp);
        rateLimitFilter.initMetriques(); // @PostConstruct non déclenché hors Spring : init manuelle des compteurs
        ReflectionTestUtils.setField(rateLimitFilter, "maxRequestsApi", 300);
        ReflectionTestUtils.setField(rateLimitFilter, "maxRequestsLogin", 20);
    }

    // ─── Headers ─────────────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldAddRateLimitHeaders() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class))).thenReturn(1L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("300");
        assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("299");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldDecrementRemaining_WithEachRequest() throws Exception {
        AtomicLong counter = new AtomicLong(0);
        when(redis.execute(any(), anyList(), any(Object[].class)))
            .thenAnswer(inv -> counter.incrementAndGet());

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.2");
        MockHttpServletResponse r1 = new MockHttpServletResponse();
        MockHttpServletResponse r2 = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, r1, filterChain);
        rateLimitFilter.doFilterInternal(request, r2, filterChain);

        int remaining1 = Integer.parseInt(r1.getHeader("X-RateLimit-Remaining"));
        int remaining2 = Integer.parseInt(r2.getHeader("X-RateLimit-Remaining"));
        assertThat(remaining2).isLessThan(remaining1);
    }

    // ─── X-Forwarded-For ─────────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldUseFirstIpFromXForwardedFor() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class))).thenReturn(1L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1"); // proxy de confiance → en-tête honoré
        request.addHeader("X-Forwarded-For", "203.0.113.5, 10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        assertThat(clePassee()).isEqualTo("rl:api:203.0.113.5");
        verify(filterChain).doFilter(request, response);
    }

    /**
     * Cœur du correctif : sans proxy de confiance en amont, l'en-tête est du texte
     * fourni par l'attaquant. S'il était honoré, il suffirait de le faire varier à
     * chaque tentative pour ne jamais atteindre la limite.
     */
    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldIgnoreXForwardedFor_WhenClientIsNotATrustedProxy() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class))).thenReturn(1L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.200");            // client direct, non déclaré
        request.addHeader("X-Forwarded-For", "1.2.3.4");   // usurpation tentée
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        // Le compteur reste indexé sur l'adresse de la socket, non falsifiable.
        assertThat(clePassee()).isEqualTo("rl:api:203.0.113.200");
    }

    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldIgnoreXRealIp_WhenClientIsNotATrustedProxy() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class))).thenReturn(1L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.7");
        request.addHeader("X-Real-IP", "9.9.9.9");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        assertThat(clePassee()).isEqualTo("rl:api:198.51.100.7");
    }

    /** Récupère la clé Redis effectivement utilisée par le filtre. */
    @SuppressWarnings("unchecked")
    private String clePassee() {
        org.mockito.ArgumentCaptor<java.util.List<String>> captor =
                org.mockito.ArgumentCaptor.forClass(java.util.List.class);
        verify(redis).execute(any(), captor.capture(), any(Object[].class));
        return captor.getValue().get(0);
    }

    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldFallbackToRemoteAddr_WhenNoXForwardedFor() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class))).thenReturn(1L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.100");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("299");
        verify(filterChain).doFilter(request, response);
    }

    // ─── Rate limit enforcement ───────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldReturn429_WhenLimitExceeded() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class))).thenReturn(301L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.99");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("0");
        verify(filterChain, never()).doFilter(any(), any());
    }

    // ─── Endpoint login — limite réduite ─────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldApplyReducedLimit_ForLoginEndpoint() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class))).thenReturn(15L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/auth/login");
        request.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        // Login limit = 20, count = 15, remaining = 5
        assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("20");
        assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("5");
        verify(filterChain).doFilter(request, response);
    }

    /**
     * Route de connexion RÉELLEMENT utilisée par le frontend. L'ancienne détection
     * cherchait la sous-chaîne "/auth/login" : /api/auth/connecter ne correspondait
     * pas et héritait de la limite API (300/min), rendant le bruteforce praticable.
     */
    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldApplyReducedLimit_ForConnecterEndpoint() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class))).thenReturn(15L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/auth/connecter");
        request.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("20");
        assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("5");
        assertThat(clePassee()).startsWith("rl:login:");
    }

    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldApplyReducedLimit_ForPasswordResetEndpoint() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class))).thenReturn(1L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/auth/mot-de-passe-oublie");
        request.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("20");
    }

    /** /api/auth/refresh doit rester sur la limite large (onglets multiples). */
    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldKeepWideLimit_ForRefreshEndpoint() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class))).thenReturn(1L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/auth/refresh");
        request.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("300");
    }

    // ─── Fail-open quand Redis est indisponible ──────────────────

    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldAllowRequest_WhenRedisUnavailable() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class)))
            .thenThrow(new RuntimeException("Redis indisponible"));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        // Fail-open : la requête passe même si Redis est down
        verify(filterChain).doFilter(request, response);
    }

    // ─── Redis retourne null ─────────────────────────────────────

    @Test
    @SuppressWarnings("unchecked")
    void doFilterInternal_ShouldAllowRequest_WhenRedisReturnsNull() throws Exception {
        when(redis.execute(any(), anyList(), any(Object[].class))).thenReturn(null);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }
}
