package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "parametres_universite")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParametresUniversite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    // Frais paramétrables
    @Builder.Default
    private Double fraisInscription = 50.0;
    @Builder.Default
    private Double fraisReleve = 5.0;
    @Builder.Default
    private Double fraisDiplome = 20.0;
    @Builder.Default
    private Double fraisParCredit = 0.0;

    // Délibération
    @Builder.Default
    private Boolean deliberationAutomatique = true;
    @Builder.Default
    private Integer nbJoursPublication = 5;

    // Inscriptions
    @Builder.Default
    private Boolean inscriptionMultiple = false;
    @Builder.Default
    private Integer delaiValidationDossier = 15;

    // Notifications
    @Builder.Default
    private Boolean emailNotification = true;
    @Builder.Default
    private Boolean smsNotification = false;

    // Messagerie universite (hors inscription)
    @Column(length = 150)
    private String emailMessagerie;

    @Column(length = 150)
    private String nomExpediteurMessagerie;

    @Column(updatable = false)
    private java.time.LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = java.time.LocalDateTime.now();
    }
}