package cd.genuc.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    // ═══ Chemins publics (le filtre ne s'exécute pas) ═══
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
        "/api/auth/connecter",
        "/api/auth/login",
        "/api/auth/inscrire",
        "/api/auth/2fa/login-verify",
        "/api/auth/refresh",
        "/api/auth/logout",
        "/api/universites/public",
        "/api/universites/public/",
        "/api/palmares/public",
        "/api/departements/public/",
        "/api/cours/public/",
        "/api/filieres/public/",
        // Lecture publique des promotions d'une filière (formulaire TachPay anonyme).
        // Seul GET /api/promotions/filiere/{id} existe sous ce préfixe, sans @PreAuthorize.
        "/api/promotions/filiere/",
        // NB : PAS "/api/public/" en entier — cela ferait sauter le filtre JWT pour
        // /api/public/admin/** (gestion des dossiers), rendant l'utilisateur anonyme
        // et provoquant un 403 sur les @PreAuthorize. Seule la soumission publique
        // (/api/public/inscription) doit ignorer le filtre ; les autres chemins
        // /api/public/** passent par le filtre (qui laisse tout de même passer les
        // requêtes sans token).
        "/api/public/inscription",
        "/api/inscriptions",
        // "/api/etudiants" retiré : l'endpoint n'est plus public (oracle d'énumération).
        "/api/verifier/",
        "/api/deliberation/verifier/",
        "/api/activation/",
        "/actuator/health",
        "/api/emploi-universitaire/offres/publiques",
        "/api/emploi-universitaire/stats",
        "/api/chatbot/question",
        "/api/emploi/offres/publiques",
        "/api/dossiers",
        "/api/tachpay/webhook/",
        // Alias hérité (ancien nom TachFee) — les consoles opérateur peuvent
        // encore pointer sur ce préfixe.
        "/api/tachfee/webhook/"
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Une entrée se terminant par "/" est un préfixe ; sinon correspondance exacte.
        // Un startsWith global ferait sauter le filtre pour les sous-chemins PROTÉGÉS
        // (ex: /api/etudiants/recherche, /api/inscriptions/universite/{id}/en-attente),
        // dont le JWT ne serait alors jamais lu → 401 pour des utilisateurs légitimes.
        return PUBLIC_PATHS.stream().anyMatch(p ->
                p.endsWith("/") ? path.startsWith(p) : path.equals(p));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (jwtService.estDefiMfa(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String email = jwtService.extraireEmail(token);
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                if (jwtService.estValide(token, userDetails)) {
                    var authorities = jwtService.extraireAuthorites(token);
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            log.debug("Jeton JWT invalide ou expiré : {}", e.getMessage());
        }
        filterChain.doFilter(request, response);
    }

    /**
     * Extrait le JWT depuis l'en-tête Authorization ou depuis le cookie HttpOnly.
     * Le cookie est la source principale quand USE_COOKIE_JWT=true.
     */
    private String extractToken(HttpServletRequest request) {
        // 1. Vérifier l'en-tête Authorization (fallback pour les clients non-browser)
        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // 2. Vérifier le cookie HttpOnly (source principale pour le navigateur)
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("genuc_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }
}