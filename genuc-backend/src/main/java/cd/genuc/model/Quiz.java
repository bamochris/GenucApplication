package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private String description;

    @ManyToOne
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    private Integer dureeMinutes;
    @Builder.Default
    private Integer noteSur = 20;
    @Builder.Default
    private Integer seuilReussite = 10;
    @Builder.Default
    private Integer tentativeMax = 3;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutQuiz statut = StatutQuiz.BROUILLON;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    public enum StatutQuiz {
        BROUILLON, PUBLIE, TERMINE, ARCHIVE
    }
}