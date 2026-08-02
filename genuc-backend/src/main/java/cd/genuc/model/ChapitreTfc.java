package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chapitres_tfc")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapitreTfc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tfc_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Tfc tfc;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private Integer ordre = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutChapitre statut = StatutChapitre.A_DEPOSER;

    private LocalDateTime dateDepot;

    private String url;
    private String nomFichier;

    @Column(columnDefinition = "TEXT")
    private String retour;

    public enum StatutChapitre {
        A_DEPOSER, DEPOSE, VALIDE, REVISION
    }
}
