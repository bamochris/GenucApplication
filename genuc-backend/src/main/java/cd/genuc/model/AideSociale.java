package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "aides_sociales")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AideSociale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "etudiant_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Etudiant etudiant;

    @ManyToOne
    @JoinColumn(name = "dossier_social_id")
    @JsonIgnore
    @ToString.Exclude
    private DossierSocial dossierSocial;

    @Enumerated(EnumType.STRING)
    private TypeAide type;

    private String description;
    private Double montantEstime;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutAide statut = StatutAide.EN_ATTENTE;

    private LocalDate dateDemande;
    private LocalDate dateTraitement;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @ManyToOne
    @JoinColumn(name = "traiteParId")
    @JsonIgnore
    @ToString.Exclude
    private Utilisateur traitePar;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        dateDemande = LocalDate.now();
    }

    public enum TypeAide {
        ALIMENTAIRE,
        TRANSPORT,
        LOGEMENT,
        MEDICALE,
        SCOLAIRE,
        AUTRE
    }

    public enum StatutAide {
        EN_ATTENTE,
        EN_TRAITEMENT,
        ACCORDEE,
        REFUSEE
    }
}
