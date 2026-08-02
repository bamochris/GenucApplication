package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dossiers_sociaux")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DossierSocial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numeroDossier;

    @OneToOne
    @JoinColumn(name = "etudiant_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Etudiant etudiant;

    @ManyToOne
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    private String situationFamiliale;
    private Integer nombreEnfants;
    private Integer nombrePersonnesCharge;

    private String professionParent;
    private Double revenuMensuelFoyer;
    private String sourceRevenu;
    private Boolean logementPropre;
    private String typeLogement;

    private Boolean handicap;
    private String typeHandicap;
    private String problemesSante;

    private Boolean demandeBourse;
    private String typeBourseDemandee;
    private Double montantDemande;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutDossierSocial statut = StatutDossierSocial.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String commentaireAdmin;

    private String urlCertificatScolarite;
    private String urlBulletinNotes;
    private String urlAttestationRevenus;
    private String urlCertificatHandicap;
    private String urlLettreMotivation;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (numeroDossier == null) {
            numeroDossier = genererNumeroDossier();
        }
    }

    private String genererNumeroDossier() {
        int annee = LocalDate.now().getYear();
        return String.format("SOC-%d-%06d", annee, System.currentTimeMillis() % 1000000);
    }

    public enum StatutDossierSocial {
        EN_ATTENTE, EN_ETUDE, VALIDE, REJETE
    }
}