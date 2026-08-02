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
@Table(name = "notes",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"inscription_id", "cours_id", "annee_academique", "session"}
       ))
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Notes ──────────────────────────────────────────────────
    private Double noteTP;
    private Double noteInterrogation;
    private Double noteExamen;
    private Double noteFinale;
    @Builder.Default
    private Double noteMax = 20.0;
    private Double noteRattrapage;
    private Double noteRetenue;

    // ─── Résultat ──────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    private MentionNote mention;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutNote statut = StatutNote.EN_COURS;   // ← utilisez ce champ pour la validation

    @Column(columnDefinition = "TEXT")
    private String appreciation;

    @Builder.Default
    private Integer nbAbsences = 0;
    @Builder.Default
    private boolean excluAbsences = false;

    // ─── Contexte ──────────────────────────────────────────────
    @Column(nullable = false)
    private String anneeAcademique;

    @Builder.Default
    private Integer session = 1;
    private Integer credits;

    // ─── Timestamps ────────────────────────────────────────────
    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime modifieLe;

    @PrePersist
    protected void onCreate() { creeLe = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { modifieLe = LocalDateTime.now(); }

    // ─── Relations ──────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    private Long professeurId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id")
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    // ─── Méthodes métier ────────────────────────────────────────

    /**
     * Calcule la note finale selon la pondération standard :
     * 30% TP, 20% Interrogation, 50% Examen.
     */
    public void calculerNoteFinale() {
        if (noteExamen == null) return;

        double total = 0;
        double poids = 0;

        if (noteTP != null)            { total += noteTP * 0.30;           poids += 0.30; }
        if (noteInterrogation != null) { total += noteInterrogation * 0.20; poids += 0.20; }
        total += noteExamen * 0.50;    poids += 0.50;

        this.noteFinale = poids > 0 ? Math.round((total / poids) * 100.0) / 100.0 : 0;
        this.noteRetenue = this.noteFinale;
        this.mention = calculerMention(this.noteFinale, noteMax);
    }

    /**
     * Applique une note de rattrapage (session 2).
     */
    public void appliquerRattrapage(double noteRattrapage) {
        this.noteRattrapage = noteRattrapage;
        this.noteRetenue = noteRattrapage;
        this.mention = calculerMention(this.noteRetenue, noteMax);
        this.session = 2;
    }

    private static MentionNote calculerMention(Double note, Double max) {
        if (note == null || max == null || max == 0) return MentionNote.AJOURNE;
        double pct = (note / max) * 100;
        if (pct >= 90)     return MentionNote.TRES_GRANDE_DISTINCTION;
        if (pct >= 80)     return MentionNote.GRANDE_DISTINCTION;
        if (pct >= 70)     return MentionNote.DISTINCTION;
        if (pct >= 60)     return MentionNote.SATISFACTION;
        if (pct >= 50)     return MentionNote.REUSSITE;
        return MentionNote.AJOURNE;
    }

    // ─── Enums ──────────────────────────────────────────────────

    public enum StatutNote {
        EN_COURS,      // saisie en cours
        SOUMISE,       // soumise pour validation
        VALIDEE,       // validée par le chef de département
        PUBLIEE,       // visible par l'étudiant
        CONTESTEE      // contestée par l'étudiant
    }

    public enum MentionNote {
        TRES_GRANDE_DISTINCTION,
        GRANDE_DISTINCTION,
        DISTINCTION,
        SATISFACTION,
        REUSSITE,
        AJOURNE
    }
}