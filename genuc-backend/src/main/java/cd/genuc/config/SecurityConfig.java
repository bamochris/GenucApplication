package cd.genuc.config;

import cd.genuc.security.JwtAuthFilter;
import cd.genuc.security.RateLimitFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.HeaderWriter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;
    private final UserDetailsService userDetailsService;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;

    @Value("${app.cors.allowed-methods:GET,POST,PUT,PATCH,DELETE,OPTIONS}")
    private String allowedMethods;

    @Value("${app.cors.allowed-headers:Authorization,Content-Type,X-Requested-With,X-RateLimit-Limit,X-RateLimit-Remaining,X-RateLimit-Reset,Accept,Origin,Cache-Control,X-CSRF-Token,X-XSRF-TOKEN}")
    private String allowedHeaders;

    @Value("${app.cors.exposed-headers:Authorization,X-RateLimit-Limit,X-RateLimit-Remaining,X-RateLimit-Reset,X-Total-Count,X-CSRF-Token}")
    private String exposedHeaders;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   HeaderWriter ecrivainCacheControl) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                // Spring Security 6 résout le jeton CSRF PARESSEUSEMENT : le cookie
                // XSRF-TOKEN n'est écrit que si le jeton est réellement lu pendant la
                // requête. Rien ne le lisait, donc aucun cookie n'était jamais émis, le
                // SPA n'avait pas de jeton à renvoyer et TOUT POST repartait en 403
                // (permitAll n'exempte PAS de CSRF). C'est la cause racine : sans ce
                // handler, exempter /api/auth/** ne débloque que la connexion et laisse
                // tous les autres écrits cassés.
                .csrfTokenRequestHandler(csrfTokenRequestHandler())
                .ignoringRequestMatchers(
                    // Appels serveur à serveur : pas de navigateur, donc pas de risque
                    // CSRF, et l'opérateur ne peut pas porter de jeton.
                    "/api/tachpay/webhook/**",
                    "/api/tachfee/webhook/**",
                    "/api/payments/callback/**",
                    // Endpoints d'AMORÇAGE uniquement : ils précèdent l'obtention d'une
                    // session, l'utilisateur n'a encore rien à protéger. Volontairement
                    // énumérés au lieu de /api/auth/** : ce joker exemptait aussi
                    // changer-mot-de-passe, logout, ajouter-email et photo — des actions
                    // d'un utilisateur DÉJÀ connecté, précisément la cible d'un CSRF.
                    "/api/auth/connecter",
                    "/api/auth/login",
                    // /api/auth/inscrire n'est plus ici : c'est désormais une action d'un
                    // SUPER_ADMIN connecté, donc exactement la cible d'un CSRF (créer un
                    // compte privilégié à son insu). Même raisonnement que pour
                    // changer-mot-de-passe ci-dessus. (/api/auth/register n'a jamais existé
                    // côté contrôleur — entrée morte supprimée au passage.)
                    "/api/auth/refresh",
                    "/api/auth/mot-de-passe-oublie",
                    "/api/auth/2fa/login-verify"
                )
            )
            // En-têtes de sécurité HTTP
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(ct -> {})
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31_536_000))
                .referrerPolicy(rp -> rp
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives(
                        "default-src 'self'; " +
                        "script-src 'self'; " +
                        "style-src 'self' 'unsafe-inline'; " +
                        "img-src 'self' data: https:; " +
                        "font-src 'self'; " +
                        "connect-src 'self' https:; " +
                        "frame-src 'none'; " +
                        "object-src 'none'; " +
                        "base-uri 'self'; " +
                        "form-action 'self'"
                    ))
                .permissionsPolicyHeader(pp -> pp
                    .policy("camera=(), microphone=(), geolocation=()"))
                // L'écrivain par défaut de Spring Security est désactivé parce qu'il pose
                // no-store sur TOUT, y compris les ressources publiques que l'on veut
                // justement laisser le navigateur garder (liste des établissements…).
                // Il est remplacé — et non simplement supprimé, ce qui était le cas
                // auparavant — par un écrivain qui distingue les deux situations :
                // no-store par défaut, max-age court sur la liste blanche publique.
                // Voir HttpCacheConfig.
                .cacheControl(cache -> cache.disable())
                .addHeaderWriter(ecrivainCacheControl)
            )
            .authorizeHttpRequests(auth -> auth
                // ═══ Création de comptes : ACTE ADMINISTRATIF, jamais public ═══
                //
                // ⚠️ Doit précéder le permitAll sur /api/auth/** ci-dessous : la première
                // règle qui correspond gagne.
                //
                // POST /api/auth/inscrire lit le RÔLE dans le corps de la requête
                // (AuthController.inscrire) et AuthService.validerRegleRole ne contrôle que
                // la présence d'universiteId/departementId pour certains rôles — SUPER_ADMIN
                // tombait dans le cas par défaut, sans aucune vérification. Le compte était
                // créé actif, avec un JWT renvoyé dans la foulée : sous permitAll, n'importe
                // quel visiteur pouvait s'octroyer les pleins pouvoirs sur la plateforme en
                // une requête. Aucun client (SPA, desktop, mobile) n'appelle cet endpoint —
                // l'inscription publique passe par /api/dossiers.
                .requestMatchers(HttpMethod.POST, "/api/auth/inscrire").hasRole("SUPER_ADMIN")
                // ═══ Routes publiques ═══
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/universites/public").permitAll()
                .requestMatchers("/api/universites/public/**").permitAll()
                .requestMatchers("/api/palmares/public").permitAll()
                .requestMatchers("/api/departements/public/**").permitAll()
                .requestMatchers("/api/cours/public/**").permitAll()
                .requestMatchers("/api/filieres/public/**").permitAll()
                // Lecture publique des promotions d'une filière : formulaire TachPay
                // anonyme (le chemin historique /api/promotion/public/** — singulier —
                // ne correspondait à aucun controller).
                .requestMatchers(HttpMethod.GET, "/api/promotions/filiere/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/inscriptions").permitAll()
                // POST /api/etudiants n'est plus public : ouvert, il répondait
                // « Étudiant déjà enregistré » ou « Étudiant créé » selon l'email fourni,
                // ce qui en faisait un oracle d'énumération de comptes anonyme, doublé
                // d'une création de comptes en masse sans limite. Aucun client (frontend
                // ou intégration) n'appelle cet endpoint : la soumission d'inscription
                // publique passe par /api/public/inscription et /api/dossiers, qui créent
                // l'étudiant eux-mêmes.
                .requestMatchers("/api/verifier/**").permitAll()
                .requestMatchers("/api/deliberation/verifier/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/attestations/verifier/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/lettres-acceptation/verifier/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/signatures/verifier/**").permitAll()
                .requestMatchers("/api/activation/**").permitAll()
                 .requestMatchers("/actuator/health").permitAll()
                // /actuator/prometheus doit rester ouvert au niveau applicatif : le scraper
                // Prometheus est un processus, il ne présente aucun JWT. Le protéger par un
                // rôle ne sécurise rien de plus et coupe simplement toute la métrologie.
                // Le cloisonnement se fait au niveau réseau (k8s/11-network-policies.yaml :
                // seul le namespace monitoring atteint le port 8082) et à l'ingress, qui
                // n'expose pas /actuator vers l'extérieur.
                .requestMatchers("/actuator/prometheus").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Fichiers uploadés : SEULE l'identité visuelle est publique (logos, sceaux,
                // certificats de palmarès), parce qu'un <img src="..."> sur une page publique
                // ne transmet pas le Bearer token. Tout ce qui contient une donnée personnelle
                // (uploads/dossiers, uploads/photos, TFC, stages, recours…) n'est plus servi en
                // statique : il passe par GET /api/fichiers/** qui vérifie le propriétaire.
                // La liste est celle de FichierAccesService.DOSSIERS_PUBLICS, également
                // utilisée par WebConfig — les deux doivent rester cohérentes.
                .requestMatchers(HttpMethod.GET, "/uploads/universites/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/logos/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/certificats/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/**").denyAll()
                .requestMatchers(HttpMethod.GET, "/api/annees-academiques/public").permitAll()
                // Lecture des vacations (Jour/Soir) : consultée par le formulaire
                // d'inscription public (candidat anonyme, avant tout compte).
                .requestMatchers(HttpMethod.GET, "/api/vacations/**").permitAll()
                // ── Nouvelles routes publiques ──
                .requestMatchers(HttpMethod.GET,  "/api/emploi-universitaire/offres/publiques").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/emploi-universitaire/offres/{id}").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/emploi-universitaire/stats").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/chatbot/question").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/emploi/offres/publiques").permitAll()

                // ═══ Routes par rôle ═══
                .requestMatchers("/api/recteur/**").hasRole("RECTEUR")
                .requestMatchers("/api/doyen/**").hasRole("DOYEN")
                .requestMatchers("/api/secretaire/**").hasRole("SECRETAIRE_ACADEMIQUE")
                .requestMatchers("/api/appariteur/**").hasRole("APPARITEUR")
                .requestMatchers("/api/comptable/**").hasRole("COMPTABLE")
                // La paie est le seul pan de /api/rh partagé avec la comptabilité :
                // `paie/{id}/valider` et `/rejeter` sont annotés
                // `hasRole('COMPTABLE')`. Sans cette règle plus spécifique — et
                // placée AVANT la suivante, l'ordre décidant — la règle d'URL
                // `/api/rh/**` réservée à RH primait sur l'annotation et rendait
                // ces deux routes inatteignables par tout compte. Le filtrage fin
                // reste porté par les `@PreAuthorize` de chaque méthode.
                .requestMatchers("/api/rh/paie/**")
                    .hasAnyRole("RH", "COMPTABLE", "ADMIN_UNIVERSITE", "SUPER_ADMIN")
                .requestMatchers("/api/rh/**").hasRole("RH")
                .requestMatchers("/api/social/**").hasRole("SERVICE_SOCIAL")
                .requestMatchers("/api/professeur/**").hasAnyRole("PROFESSEUR", "ENSEIGNANT", "ADMIN_UNIVERSITE", "SUPER_ADMIN")
                .requestMatchers("/api/etudiant/**").hasAnyRole("ETUDIANT", "ADMIN_UNIVERSITE", "SUPER_ADMIN", "PROFESSEUR", "ENSEIGNANT")
                .requestMatchers("/api/chef-promotion/**").hasAnyRole("CHEF_PROMOTION", "CHEF_DEPARTEMENT", "ADMIN_UNIVERSITE", "SUPER_ADMIN")
                .requestMatchers("/api/bibliothecaire/**").hasAnyRole("BIBLIOTHECAIRE", "ADMIN_UNIVERSITE", "SUPER_ADMIN")
                
                .requestMatchers("/api/paiements/gestion/**").hasAnyRole("AGENT", "CAISSIER", "ADMIN_UNIVERSITE", "SUPER_ADMIN")
                .requestMatchers("/api/echeances/**").hasAnyRole("AGENT", "CAISSIER", "ADMIN_UNIVERSITE")
                .requestMatchers("/api/remboursements/**").hasAnyRole("AGENT", "ADMIN_UNIVERSITE")

                .requestMatchers("/api/systeme/**").hasAnyRole("SUPER_ADMIN", "ADMIN_SYSTEME")
                .requestMatchers("/api/super-admin/**").hasRole("SUPER_ADMIN")
                // Supervision et purge du cache applicatif (CacheAdminController)
                .requestMatchers("/api/admin/cache/**").hasRole("SUPER_ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/annees-academiques").hasAnyRole("ADMIN_UNIVERSITE", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/annees-academiques/**").hasAnyRole("ADMIN_UNIVERSITE", "SUPER_ADMIN")
                .requestMatchers("/api/promotions/universite/**").hasAnyRole("ADMIN_UNIVERSITE", "SUPER_ADMIN")
                .requestMatchers("/api/stats/**").hasRole("SUPER_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/dossiers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/dossiers/*/paiement").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/dossiers/*/payer").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/dossiers/verifier/**").permitAll()
                // Suivi public d'un dossier d'inscription par son numéro (page /suivi-dossier)
                .requestMatchers(HttpMethod.GET, "/api/dossiers/statut/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/dossiers/paiement/statut/**").permitAll()

                // ✅ Règles TachPay (CORRIGÉ : ajout de CAISSIER)
                .requestMatchers("/api/tachpay/public/**").permitAll()
                .requestMatchers("/api/tachpay/etudiant/**").hasRole("ETUDIANT")
                .requestMatchers("/api/tachpay/admin/**").hasAnyRole("ADMIN_UNIVERSITE", "SUPER_ADMIN")
                .requestMatchers("/api/tachpay/caisse/**").hasAnyRole("AGENT", "CAISSIER", "ADMIN_UNIVERSITE", "SUPER_ADMIN")
                .requestMatchers("/api/tachpay/webhook/**").permitAll()
                // ── Alias hérités /api/tachfee/** (ancien nom TachFee) ──
                // À CONSERVER tant que les consoles opérateur (webhooks) et les
                // liens/QR déjà émis pointent sur l'ancien préfixe. Le contrôleur
                // TachPayController sert les deux préfixes.
                .requestMatchers("/api/tachfee/public/**").permitAll()
                .requestMatchers("/api/tachfee/etudiant/**").hasRole("ETUDIANT")
                .requestMatchers("/api/tachfee/admin/**").hasAnyRole("ADMIN_UNIVERSITE", "SUPER_ADMIN")
                .requestMatchers("/api/tachfee/caisse/**").hasAnyRole("AGENT", "CAISSIER", "ADMIN_UNIVERSITE", "SUPER_ADMIN")
                .requestMatchers("/api/tachfee/webhook/**").permitAll()

                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                // Sans entry point explicite, Spring Security 6 renvoie 403 même pour une requête
                // non authentifiée. Le frontend s'appuie sur 401 pour déclencher le refresh token.
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(
                        "{\"erreur\":\"Authentification requise.\",\"code\":401}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(
                        "{\"erreur\":\"Accès refusé : droits insuffisants.\",\"code\":403}");
                })
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(jwtAuthFilter, RateLimitFilter.class);

        log.info("✅ SecurityConfig chargée avec succès.");
        return http.build();
    }

    /**
     * Gestionnaire de jeton CSRF à résolution immédiate.
     *
     * <p>Par défaut, Spring Security 6 diffère la résolution du jeton pour épargner
     * un accès session/cookie aux requêtes qui n'en ont pas besoin. Pour une SPA, cet
     * optimisme est fatal : le navigateur doit avoir reçu le cookie AVANT d'émettre sa
     * première requête d'écriture. Mettre l'attribut de requête à {@code null} désactive
     * ce report, si bien que chaque réponse porte le cookie {@code XSRF-TOKEN}.</p>
     */
    @Bean
    public CsrfTokenRequestAttributeHandler csrfTokenRequestHandler() {
        CsrfTokenRequestAttributeHandler handler = new CsrfTokenRequestAttributeHandler();
        handler.setCsrfRequestAttributeName(null);
        return handler;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        configuration.setAllowedMethods(Arrays.asList(allowedMethods.split(",")));
        configuration.setAllowedHeaders(Arrays.asList(allowedHeaders.split(",")));
        configuration.setExposedHeaders(Arrays.asList(exposedHeaders.split(",")));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}