package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Support de cours (fichier) déposé par un professeur pour un cours donné :
 * PDF, vidéo, document, présentation... Le fichier lui-même est stocké dans
 * S3 (voir {@link cd.genuc.service.S3Service}) ; cette entité ne garde que
 * les métadonnées + l'URL de téléchargement.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "supports_cours")
public class SupportCours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeSupport type;

    /** Clé S3 du fichier (utilisée pour la suppression / régénération d'URL). */
    @Column(name = "s3_key", nullable = false, length = 500)
    private String s3Key;

    /** URL de téléchargement (pré-signée S3 ou CloudFront). */
    @Column(length = 1000)
    private String url;

    private String nomFichierOriginal;

    private Long tailleOctets;

    /** Utilisateur (professeur) ayant déposé le support. */
    @Column(nullable = false)
    private Long professeurId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    public enum TypeSupport {
        PDF, VIDEO, DOCUMENT, PPT
    }
}
