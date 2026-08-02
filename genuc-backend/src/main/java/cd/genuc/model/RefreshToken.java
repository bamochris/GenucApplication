package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens", indexes = {
    @Index(name = "idx_refresh_token_token", columnList = "token"),
    @Index(name = "idx_refresh_token_utilisateur", columnList = "utilisateur_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 512)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "expire_le", nullable = false)
    private Instant expireLe;

    @Column(name = "revoque")
    @Builder.Default
    private boolean revoque = false;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = Instant.now();
    }

    public boolean estExpire() {
        return Instant.now().isAfter(expireLe);
    }
}
