package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Demande de signature adressée à un responsable ({@link SignataireUniversite}) :
 * un document unique ou un lot de documents du même type. Le signataire reçoit
 * une notification, puis valide (sa signature est apposée sur chaque document
 * via {@link cd.genuc.service.SignatureElectroniqueService}) ou refuse.
 */
@Entity
@Table(name = "demandes_signature")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandeSignature {

    public enum Statut { EN_ATTENTE, VALIDEE, REFUSEE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "universite_id")
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "signataire_id")
    @JsonIgnore
    @ToString.Exclude
    private SignataireUniversite signataire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TypeDocumentSignable typeDocument;

    // IDs des documents du lot, séparés par des virgules (ex. "12,15,18")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String documentIds;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.EN_ATTENTE;

    private Long demandeParId;

    @Column(length = 150)
    private String demandeParNom;

    @Column(columnDefinition = "TEXT")
    private String motifRefus;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime traiteLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    public java.util.List<Long> getDocumentIdsListe() {
        if (documentIds == null || documentIds.isBlank()) return java.util.List.of();
        return java.util.Arrays.stream(documentIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::valueOf)
                .toList();
    }
}
