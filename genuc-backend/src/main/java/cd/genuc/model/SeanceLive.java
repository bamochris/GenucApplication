package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "seances_live")
public class SeanceLive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime dateDebut;

    @Builder.Default
    private Integer dureePrevueMinutes = 90;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutSeance statut = StatutSeance.PLANIFIEE;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PlateformeVideo plateforme = PlateformeVideo.JITSI;

    private String lienReunion;
    private String codeAcces;
    private String idReunionExterne;

    @Builder.Default
    private boolean enregistrable = true;
    private String urlEnregistrement;
    @Builder.Default
    private Integer nbParticipants = 0;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() { creeLe = LocalDateTime.now(); }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    private Long professeurId;
    private String professeurNom;

    public enum StatutSeance {
        PLANIFIEE, EN_COURS, TERMINEE, ANNULEE
    }

    public enum PlateformeVideo {
        JITSI, ZOOM, GOOGLE_MEET, MICROSOFT_TEAMS, AUTRE
    }
}