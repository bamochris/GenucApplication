package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * État de contrôle académique d'un cours par le chef de département (workflow de
 * validation de la remise des notes : reçu / en attente / validé / retourné).
 * Table légère additive — ne modifie pas l'entité Cours ni le workflow de délibération.
 */
@Entity
@Table(name = "controle_cours", uniqueConstraints = @UniqueConstraint(columnNames = {"cours_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ControleCours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cours_id", nullable = false, unique = true)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutControle statut = StatutControle.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String motifRetour;

    @Column(columnDefinition = "TEXT")
    private String commentaireCorrection;

    private Long valideParId;

    private LocalDateTime dateValidation;

    private LocalDateTime dateRetour;

    private LocalDateTime modifieLe;

    @PreUpdate
    protected void onUpdate() {
        modifieLe = LocalDateTime.now();
    }

    public enum StatutControle {
        RECU, EN_ATTENTE, VALIDE, RETOURNE
    }
}
