package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sujets_tfc")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SujetTfc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    private String domaine;

    @Builder.Default
    private String niveau = "L3";

    @Column(nullable = false)
    private Long professeurId;

    private String professeurNom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutSujet statut = StatutSujet.PROPOSE;

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    public enum StatutSujet {
        PROPOSE, VALIDE, REFUSE, ATTRIBUE
    }
}
