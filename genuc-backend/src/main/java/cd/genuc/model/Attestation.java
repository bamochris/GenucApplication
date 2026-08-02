package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attestations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attestation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numeroAttestation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeAttestation type;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    @Column(length = 80)
    private String codeDocument;

    @Column(length = 200)
    private String libelleDocument;

    private String motif;

    @ManyToOne
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @ManyToOne
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    private Long demandeParId;
    private String demandeParNom;

    private Long valideParId;
    private String valideParNom;

    private LocalDate dateDemande;
    private LocalDate dateValidation;
    private LocalDate dateEmission;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutAttestation statut = StatutAttestation.EN_ATTENTE;

    private String urlFichier;
    private String uuidVerification;

    @Builder.Default
    private boolean publiee = false;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        dateDemande = LocalDate.now();
        if (numeroAttestation == null) {
            numeroAttestation = genererNumeroAttestation();
        }
        if (uuidVerification == null) {
            uuidVerification = java.util.UUID.randomUUID().toString();
        }
    }

    private String genererNumeroAttestation() {
        int annee = LocalDate.now().getYear();
        return String.format("ATT-%d-%08d", annee, System.currentTimeMillis() % 100000000);
    }

    public enum TypeAttestation {
        INSCRIPTION,
        FREQUENTATION,
        REUSSITE,
        SCOLARITE,
        BOURSE,
        CONDUITE,
        PHYSIQUE,
        DIPLOME,
        AUTRE
    }

    public enum StatutAttestation {
        EN_ATTENTE,
        VALIDE,
        REJETE,
        EMISE
    }
}