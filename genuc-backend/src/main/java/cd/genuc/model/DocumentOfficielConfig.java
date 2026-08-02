package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents_officiels_config",
        uniqueConstraints = @UniqueConstraint(name = "uk_document_officiel_universite_code", columnNames = {"universite_id", "code"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentOfficielConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @Column(nullable = false, length = 80)
    private String code;

    @Column(nullable = false, length = 200)
    private String libelle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TypeSource typeSource;

    @Enumerated(EnumType.STRING)
    private Attestation.TypeAttestation attestationType;

    @Column(length = 80)
    private String fraisCodeRequis;

    @Column(columnDefinition = "TEXT")
    private String modeleContenu;

    @Builder.Default
    private boolean actif = true;

    @Builder.Default
    private Integer ordreAffichage = 0;

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

    public enum TypeSource {
        ATTESTATION,
        RELEVE
    }
}