package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "calendrier_academique")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendrierAcademique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = false)
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeEvenement type;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CouleurEvenement couleur = CouleurEvenement.BLEU;

    @Builder.Default
    private boolean actif = true;

    @ManyToOne
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    private Long anneeAcademiqueId;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    public enum TypeEvenement {
        RENTREE_ACADEMIQUE, VACANCES, EXAMENS_SESSION_1, EXAMENS_SESSION_2,
        INSCRIPTIONS, DELIBERATIONS, JOUR_FERIE, REUNION, AUTRE
    }

    public enum CouleurEvenement {
        ROUGE, BLEU, VERT, ORANGE, VIOLET, GRIS
    }
}