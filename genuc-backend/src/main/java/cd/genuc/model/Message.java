// cd.genuc.model.Message.java
package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sujet;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    // ── Expéditeur ──────────────────────────────────────────────
    private Long expediteurId;
    private String expediteurNom;
    private String expediteurRole;

    // ── Destinataire ────────────────────────────────────────────
    private Long destinataireId;
    private String destinataireNom;
    
    @Column(length = 50)
    private String destinataireType; // "SCOLARITE", "DEPARTEMENT", "CAISSE", "DIRECTION", "ENSEIGNANT"

    // ── Contexte ────────────────────────────────────────────────
    private Long inscriptionId;
    private Long universiteId;

    // ── Statut ──────────────────────────────────────────────────
    @Builder.Default
    private boolean lu = false;
    
    private LocalDateTime dateLecture;

    // ── Réponse (si l'admin répond) ─────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String reponse;

    private Long reponseParId;
    private String reponseParNom;
    private LocalDateTime dateReponse;

    @Column(updatable = false)
    private LocalDateTime dateEnvoi;

    @PrePersist
    protected void onCreate() {
        dateEnvoi = LocalDateTime.now();
    }
}