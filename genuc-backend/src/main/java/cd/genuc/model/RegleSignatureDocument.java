package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Règle : pour une université donnée, quel {@link SignataireUniversite} signe par défaut
 * un type de document donné (ex: DIPLOME → Recteur, ATTESTATION → Secrétaire Académique).
 * Reste toujours modifiable au cas par cas au moment de la signature.
 */
@Entity
@Table(name = "regles_signature_document",
        uniqueConstraints = @UniqueConstraint(columnNames = {"universite_id", "type_document"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegleSignatureDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_document", nullable = false)
    private TypeDocumentSignable typeDocument;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signataire_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private SignataireUniversite signataire;

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
