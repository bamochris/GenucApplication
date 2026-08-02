package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Jeton d'enregistrement Firebase Cloud Messaging (FCM) d'un appareil — permet d'envoyer des
 * notifications push à l'application mobile/web d'un utilisateur. Un utilisateur peut avoir
 * plusieurs jetons (plusieurs appareils connectés simultanément).
 */
@Entity
@Table(name = "device_tokens", uniqueConstraints = @UniqueConstraint(columnNames = "token"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Utilisateur utilisateur;

    @Column(nullable = false, length = 512)
    private String token;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Plateforme plateforme = Plateforme.WEB;

    @Builder.Default
    private boolean actif = true;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime derniereUtilisation;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        derniereUtilisation = LocalDateTime.now();
    }

    public enum Plateforme {
        ANDROID, IOS, WEB
    }
}
