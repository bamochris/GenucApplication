package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "offres_stage")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OffreStage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false)
    private String entreprise;

    private String localisation;

    private Integer dureeSemaines;

    private Double remuneration;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutOffre statut = StatutOffre.OUVERTE;

    @Column(updatable = false)
    private LocalDateTime datePublication;

    private Long publieParId;

    @PrePersist
    protected void onCreate() {
        datePublication = LocalDateTime.now();
    }

    public enum StatutOffre {
        OUVERTE, FERMEE
    }
}
