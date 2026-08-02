package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Recours académique : contestation d'une note, d'un matricule, d'un cours manquant, etc.
 * Soumis par un étudiant (via son inscription active), traité par le chef de département /
 * l'administration (côté "gestion des recours").
 */
@Entity
@Table(name = "recours")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cours_id")
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeRecours type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    private String anneeAcademique;

    private String pieceJointeUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutRecours statut = StatutRecours.SOUMIS;

    @Column(columnDefinition = "TEXT")
    private String reponse;

    private Long traiteParId;

    @Column(updatable = false)
    private LocalDateTime dateSoumission;

    private LocalDateTime dateReponse;

    @PrePersist
    protected void onCreate() {
        dateSoumission = LocalDateTime.now();
    }

    public enum TypeRecours {
        ERREUR_NOTE, ERREUR_MATRICULE, COURS_MANQUANT, CONTESTATION, AUTRE
    }

    public enum StatutRecours {
        SOUMIS, EN_COURS, ACCEPTE, REFUSE
    }
}
