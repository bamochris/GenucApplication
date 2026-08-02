package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Trace d'une signature électronique réellement appliquée sur une instance de document
 * (indépendamment du type — attestation, diplôme, lettre d'acceptation...). Sert à la fois
 * de preuve d'intégrité (hash) et d'ancrage pour la vérification publique par QR code.
 */
@Entity
@Table(name = "signatures_electroniques")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignatureElectronique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_document", nullable = false)
    private TypeDocumentSignable typeDocument;

    // Id de l'entité métier signée (Attestation.id, LettreAcceptation.id, ...)
    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signataire_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private SignataireUniversite signataire;

    // Utilisateur ayant déclenché la signature (peut différer du signataire — ex: le secrétaire
    // valide au nom du recteur, par délégation).
    private Long appliqueParId;
    private String appliqueParNom;

    // Empreinte SHA-256 (hex) des champs canoniques du document au moment de la signature.
    @Column(nullable = false, length = 64)
    private String hashDocument;

    // Code de vérification public — réutilise l'UUID de vérification du document porteur
    // quand il existe déjà (Attestation.uuidVerification, LettreAcceptation.uuidVerification).
    @Column(nullable = false, unique = true)
    private String codeVerification;

    @Column(updatable = false)
    private LocalDateTime dateSignature;

    @Builder.Default
    private boolean revoquee = false;

    private String motifRevocation;
    private LocalDateTime dateRevocation;

    @PrePersist
    protected void onCreate() {
        dateSignature = LocalDateTime.now();
    }
}
