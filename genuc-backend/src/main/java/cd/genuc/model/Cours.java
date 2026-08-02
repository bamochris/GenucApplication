package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cours")
public class Cours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String niveau;

    @Builder.Default
    private Integer credits = 3;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutCours statut = StatutCours.BROUILLON;

    @Builder.Default
    private boolean enLigneSeulement = false;

    private String thumbnail;

    @Builder.Default
    private String langue = "Français";

    private String anneeAcademique;

    @Builder.Default
    private Integer dureeTotaleMinutes = 0;

    @Builder.Default
    private Integer nombreLecons = 0;

    @Column(columnDefinition = "TEXT")
    private String objectifs;

    @Column(columnDefinition = "TEXT")
    private String prerequis;

    private String publicCible;

    @Column(columnDefinition = "TEXT")
    private String planDuCours;

    @Builder.Default
    private Integer nbInscrits = 0;

    private Double noteMoyenne;

    @Builder.Default
    private boolean certificatDisponible = false;

    private String videoIntroduction;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private NiveauDifficulte niveauDifficulte = NiveauDifficulte.INTERMEDIAIRE;

    @Builder.Default
    private Double prix = 0.0;

    private Double ratingMoyen;

    @Builder.Default
    private Integer nbEvaluations = 0;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime modifieLe;

    private LocalDateTime publieLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        modifieLe = LocalDateTime.now();
        int annee = java.time.LocalDate.now().getYear();
        if (anneeAcademique == null) anneeAcademique = annee + "-" + (annee + 1);
    }

    @PreUpdate
    protected void onUpdate() { 
        modifieLe = LocalDateTime.now(); 
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departement_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Departement departement;

    private Long professeurId;
    private String professeurNom;

    @OneToMany(mappedBy = "cours", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @Builder.Default
    private List<Lecon> lecons = new ArrayList<>();

    @OneToMany(mappedBy = "cours", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @Builder.Default
    private List<SeanceLive> seancesLive = new ArrayList<>();

    @OneToMany(mappedBy = "cours", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @Builder.Default
    private List<ProgressionEtudiant> progressions = new ArrayList<>();

    @OneToMany(mappedBy = "cours", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @Builder.Default
    private List<Quiz> quizs = new ArrayList<>();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    @JsonIgnore
    @ToString.Exclude
    private Promotion promotion;

    public enum StatutCours {
        BROUILLON, PUBLIE, ARCHIVE, SUSPENDU
    }

    public enum NiveauDifficulte {
        DEBUTANT, INTERMEDIAIRE, AVANCE, EXPERT
    }

    public void incrementerNbInscrits() {
        this.nbInscrits = (this.nbInscrits == null ? 0 : this.nbInscrits) + 1;
    }

    public void decrementerNbInscrits() {
        if (this.nbInscrits != null && this.nbInscrits > 0) {
            this.nbInscrits--;
        }
    }

    public void ajouterEvaluation(int note) {
        if (note < 1 || note > 5) {
            throw new IllegalArgumentException("La note doit être comprise entre 1 et 5");
        }
        double totalNotes = (this.ratingMoyen != null ? this.ratingMoyen * this.nbEvaluations : 0);
        this.nbEvaluations = (this.nbEvaluations == null ? 0 : this.nbEvaluations) + 1;
        this.ratingMoyen = (totalNotes + note) / this.nbEvaluations;
    }

    public boolean isGratuit() {
        return prix == null || prix <= 0;
    }

    public boolean isPublie() {
        return statut == StatutCours.PUBLIE;
    }

    public Double getMoyenneProgression() {
        if (progressions == null || progressions.isEmpty()) {
            return 0.0;
        }
        return progressions.stream()
            .mapToDouble(p -> p.getPourcentageCompletion() != null ? p.getPourcentageCompletion() : 0)
            .average()
            .orElse(0.0);
    }

    public int getNbQuizs() {
        return quizs != null ? quizs.size() : 0;
    }
}