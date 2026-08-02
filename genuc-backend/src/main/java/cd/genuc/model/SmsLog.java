package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sms_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String telephone;
    private String message;
    private String status;      // "ENVOYE", "ECHEC"
    private String erreur;
    private LocalDateTime dateEnvoi;
    private Long utilisateurId; // optionnel, qui a déclenché l'envoi

    @PrePersist
    protected void onCreate() {
        dateEnvoi = LocalDateTime.now();
    }
}