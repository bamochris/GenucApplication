package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Résultat d'analyse machine locale (déterministe, sans IA) d'un document téléversé.
 * L'empreinte SHA-256 est conservée pour détecter les doublons entre pièces / dossiers.
 */
@Entity
@Table(name = "documents_analyse",
       uniqueConstraints = @UniqueConstraint(columnNames = {"dossier_id", "cle_document"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAnalyse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long dossierId;

    private String cleDocument;        // ex: urlDiplomeEtat

    @Column(length = 64)
    private String sha256;

    private String typeDetecte;        // PDF, JPEG, PNG, INCONNU

    private Integer scoreQualite;      // 0-100

    @Column(columnDefinition = "TEXT")
    private String alertes;            // alertes séparées par « | »

    private LocalDateTime creeLe;

    @PrePersist
    @PreUpdate
    void touch() { creeLe = LocalDateTime.now(); }
}
