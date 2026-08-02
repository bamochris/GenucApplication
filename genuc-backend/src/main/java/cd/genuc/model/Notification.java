package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String message;

    @Enumerated(EnumType.STRING)
    private TypeNotification type;

    @ManyToOne
    @JoinColumn(name = "destinataire_id")
    @JsonIgnore
    @ToString.Exclude
    private Utilisateur destinataire;

    private Long universiteId;
    private Long coursId;
    private Long inscriptionId;

    @Builder.Default
    private boolean lue = false;
    private LocalDateTime dateEnvoi;
    private LocalDateTime dateLecture;

    @Column(columnDefinition = "TEXT")
    private String lienAction;

    @PrePersist
    protected void onCreate() {
        dateEnvoi = LocalDateTime.now();
    }

    public enum TypeNotification {
        INFO, SUCCES, ATTENTION, URGENT, RAPPEL
    }
}