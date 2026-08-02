package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "tentatives_quiz")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TentativeQuiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Quiz quiz;

    @ManyToOne
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @Builder.Default
    private Integer tentativeNumero = 1;

    @ElementCollection
    @CollectionTable(name = "reponses_etudiant")
    @MapKeyColumn(name = "question_id")
    @Column(name = "reponse_texte", columnDefinition = "TEXT")
    @Builder.Default
    private Map<Long, String> reponses = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "notes_questions")
    @MapKeyColumn(name = "question_id")
    @Column(name = "note_obtenue")
    @Builder.Default
    private Map<Long, Double> notesParQuestion = new HashMap<>();

    private Double noteTotale;
    @Builder.Default
    private boolean reussi = false;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutTentative statut = StatutTentative.EN_COURS;

    public enum StatutTentative {
        EN_COURS,
        TERMINE,
        ANNULE
    }

    @PrePersist
    protected void onCreate() {
        dateDebut = LocalDateTime.now();
    }
}