package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "connexion_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnexionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long utilisateurId;

    private String email;

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 255)
    private String userAgent;

    private boolean succes;

    private String motifEchec; // si échec

    @Column(updatable = false)
    private LocalDateTime dateConnexion;

    @PrePersist
    protected void onCreate() {
        dateConnexion = LocalDateTime.now();
    }
}