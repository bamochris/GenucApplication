package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inscriptions_vacations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionVacation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutInscription statut = StatutInscription.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacation_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Vacation vacation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Etudiant etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id")
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annee_academique_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private AnneeAcademique anneeAcademique;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    private LocalDateTime modifieLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        modifieLe = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        modifieLe = LocalDateTime.now();
    }

    public boolean estValidee() {
        return statut == StatutInscription.VALIDE;
    }

    public boolean estEnAttente() {
        return statut == StatutInscription.EN_ATTENTE;
    }

    public boolean estRejetee() {
        return statut == StatutInscription.REJETE;
    }

    public void valider() {
        this.statut = StatutInscription.VALIDE;
    }

    public void rejeter(String motif) {
        this.statut = StatutInscription.REJETE;
        this.commentaire = motif;
    }
}
