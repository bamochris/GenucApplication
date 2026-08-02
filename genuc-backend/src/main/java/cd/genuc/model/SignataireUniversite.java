package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Responsable d'une université habilité à apposer sa signature électronique sur des
 * documents officiels (attestations, diplômes, lettres d'acceptation...). Une université
 * peut enregistrer plusieurs signataires (recteur, doyen, secrétaire académique...) et
 * choisir dynamiquement lequel utiliser selon le type de document (voir
 * {@link RegleSignatureDocument}).
 */
@Entity
@Table(name = "signataires_universite")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignataireUniversite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @Column(nullable = false)
    private String nomComplet;

    // Ex: "Recteur", "Doyen de la Faculté des Sciences", "Secrétaire Général Académique"
    @Column(nullable = false)
    private String fonction;

    // Rattachement optionnel à un rôle de la plateforme, pour pré-sélection dans les règles
    @Enumerated(EnumType.STRING)
    private RoleEnum roleRattache;

    // Compte utilisateur optionnel du signataire (s'il a un accès GENUC)
    private Long utilisateurId;

    // Image de la signature manuscrite/scannée, encodée en base64 (data:image/png;base64,...)
    @Column(columnDefinition = "TEXT")
    private String signatureImage;

    @Builder.Default
    private boolean actif = true;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime modifieLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        modifieLe = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        modifieLe = LocalDateTime.now();
    }
}
