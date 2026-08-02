package cd.genuc.security;

import cd.genuc.model.Utilisateur;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${genuc.jwt.secret}")
    private String jwtSecret;

    @Value("${genuc.jwt.expiration:86400000}")
    private long jwtExpiration;

    private SecretKey cleSignature;

    @PostConstruct
    public void initialiser() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("La propriété genuc.jwt.secret est absente");
        }
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        // HS256 exige au minimum 256 bits (32 octets). Un padding null-byte affaiblit la clé.
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                "genuc.jwt.secret trop court (" + keyBytes.length + " octets). Minimum requis : 32 octets pour HS256.");
        }
        this.cleSignature = Keys.hmacShaKeyFor(keyBytes);
    }

    // Durée de vie du jeton de défi 2FA — juste assez pour saisir le code TOTP.
    private static final long MFA_CHALLENGE_EXPIRATION_MS = 2 * 60 * 1000;

    public String genererToken(Utilisateur utilisateur) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", utilisateur.getRole().name()); // "SUPER_ADMIN" (sans ROLE_)
        claims.put("nom", utilisateur.getNomComplet());
        claims.put("universiteId", utilisateur.getUniversiteId());
        claims.put("departementId", utilisateur.getDepartementId());
        claims.put("compteActive", utilisateur.isCompteActive());
        claims.put("inscriptionId", utilisateur.getInscriptionId());
        return construireToken(claims, utilisateur.getEmail(), jwtExpiration);
    }

    /**
     * Jeton de défi 2FA — délivré après vérification du mot de passe mais avant le code TOTP.
     * Ne contient aucun rôle (donc {@link JwtAuthFilter} ne peut l'utiliser pour autoriser une
     * requête protégée) et expire rapidement. Échangé contre un vrai token via
     * {@code POST /api/auth/2fa/login-verify}.
     */
    public String genererTokenDefiMfa(Utilisateur utilisateur) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("mfaPending", true);
        return construireToken(claims, utilisateur.getEmail(), MFA_CHALLENGE_EXPIRATION_MS);
    }

    public boolean estDefiMfa(String token) {
        try {
            Boolean pending = extraireTousClaims(token).get("mfaPending", Boolean.class);
            return Boolean.TRUE.equals(pending);
        } catch (Exception e) {
            return false;
        }
    }

    private String construireToken(Map<String, Object> extraClaims, String sujet, long dureeExpirationMs) {
        Date maintenant = new Date();
        Date expiration = new Date(System.currentTimeMillis() + dureeExpirationMs);
        return Jwts.builder()
                .claims(extraClaims)
                .subject(sujet)
                .issuedAt(maintenant)
                .expiration(expiration)
                .signWith(cleSignature)
                .compact();
    }

    public boolean estValide(String token, UserDetails userDetails) {
        try {
            String email = extraireEmail(token);
            return email != null && email.equals(userDetails.getUsername()) && !estExpire(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean estExpire(String token) {
        return extraireExpiration(token).before(new Date());
    }

    public String extraireEmail(String token) {
        return extraireClaim(token, Claims::getSubject);
    }

    public Date extraireExpiration(String token) {
        return extraireClaim(token, Claims::getExpiration);
    }

    public <T> T extraireClaim(String token, Function<Claims, T> resolveur) {
        Claims claims = extraireTousClaims(token);
        return resolveur.apply(claims);
    }

    private Claims extraireTousClaims(String token) {
        return Jwts.parser()
                .verifyWith((SecretKey) cleSignature)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extraireRole(String token) {
        return extraireTousClaims(token).get("role", String.class);
    }

    public Boolean estCompteActive(String token) {
        return extraireTousClaims(token).get("compteActive", Boolean.class);
    }

    public Long extraireUniversiteId(String token) {
        Object value = extraireTousClaims(token).get("universiteId");
        return value == null ? null : Long.valueOf(value.toString());
    }

    public Long extraireDepartementId(String token) {
        Object value = extraireTousClaims(token).get("departementId");
        return value == null ? null : Long.valueOf(value.toString());
    }

    public List<GrantedAuthority> extraireAuthorites(String token) {
        String role = extraireRole(token);
        // ✅ CORRECTION : ajouter le préfixe ROLE_ pour correspondre à hasRole()
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
}