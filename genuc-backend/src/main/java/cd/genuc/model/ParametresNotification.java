package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "parametres_notification")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParametresNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Utilisateur utilisateur;

    @Builder.Default
    private boolean emailActive = true;
    @Builder.Default
    private boolean smsActive = false;
    @Builder.Default
    private boolean pushActive = true;

    // Catégories
    @Builder.Default
    private boolean notifInscription = true;
    @Builder.Default
    private boolean notifPaiement = true;
    @Builder.Default
    private boolean notifNote = true;
    @Builder.Default
    private boolean notifDeliberation = true;
    @Builder.Default
    private boolean notifCours = true;
}