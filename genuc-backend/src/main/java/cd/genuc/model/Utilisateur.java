package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * Entité utilisateur de base — tous les rôles héritent de cette classe
 */
@Entity
@Table(name = "utilisateurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Utilisateur implements UserDetails {

    private static final long serialVersionUID = 1L;

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(unique = true, nullable = false)
    private String email;

    // WRITE_ONLY : le mot de passe (hash BCrypt) peut être reçu en entrée
    // (création/màj via @RequestBody) mais n'est JAMAIS renvoyé en sortie JSON.
    @Column(name = "mot_de_passe", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String motDePasse;

    private String telephone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleEnum role;

    private Long universiteId;
    private Long departementId;
    private Long inscriptionId;

    // Photo de profil (affichée dans les entêtes des portails) et photo
    // passeport (identification par les services administratifs) — chemins
    // servis via /uploads/**.
    @Column(name = "photo_profil", columnDefinition = "TEXT")
    private String photoProfil;

    @Column(name = "photo_passeport", columnDefinition = "TEXT")
    private String photoPasseport;

    @Builder.Default
    private boolean actif = true;

    @Column(name = "compte_active")
    @Builder.Default
    private boolean compteActive = false;

    @Column(name = "token_activation", length = 255)
    @JsonIgnore
    private String tokenActivation;

    @Column(name = "token_expiration")
    @JsonIgnore
    private LocalDateTime tokenExpiration;

    @Column(name = "date_activation")
    private LocalDateTime dateActivation;

    // ─── 2FA (TOTP) ─────────────────────────────────────────────
    @Column(name = "two_factor_enabled")
    @Builder.Default
    private boolean twoFactorEnabled = false;

    @Column(name = "two_factor_secret")
    @JsonIgnore
    private String twoFactorSecret;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime dernierLogin;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    // ══════════════════════════════════════════
    // UserDetails (Spring Security)
    // ══════════════════════════════════════════

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    // @JsonIgnore : sans cela, Jackson exposerait le hash sous la clé "password"
    // via ce getter UserDetails, contournant la protection du champ motDePasse.
    @Override
    @JsonIgnore
    public String getPassword() {
        return this.motDePasse;
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return this.actif;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return this.actif && this.compteActive;
    }

    public String getNomComplet() {
        return prenom + " " + nom;
    }

    /**
     * Vérifie si le token d'activation est valide (non expiré)
     */
    public boolean isTokenValide() {
        return tokenActivation != null 
            && tokenExpiration != null 
            && tokenExpiration.isAfter(LocalDateTime.now())
            && !compteActive;
    }

    @Override
    public String toString() {
        return "Utilisateur{" +
                "id=" + id +
                ", nom='" + nom + '\'' +
                ", prenom='" + prenom + '\'' +
                ", email='" + email + '\'' +
                ", role=" + role +
                ", universiteId=" + universiteId +
                ", departementId=" + departementId +
                ", inscriptionId=" + inscriptionId +
                ", actif=" + actif +
                ", compteActive=" + compteActive +
                '}';
    }
}