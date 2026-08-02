package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "lecons")
public class Lecon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer ordre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeLecon type;

    private String videoUrl;
    private String videoExterneUrl;
    private Integer dureeSecondes;

    private String documentUrl;
    private String documentNom;
    private Long documentTailleOctets;

    @Column(columnDefinition = "TEXT")
    private String contenuHtml;

    @Builder.Default
    private boolean aperçuGratuit = false;

    @Builder.Default
    private boolean actif = true;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() { creeLe = LocalDateTime.now(); }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    public enum TypeLecon {
        VIDEO, DOCUMENT, TEXTE, QUIZ, MIXTE
    }
}
