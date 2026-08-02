package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "emprunts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Emprunt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "livre_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Livre livre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Etudiant etudiant;

    private LocalDate dateEmprunt;
    private LocalDate dateRetourPrevue;
    private LocalDate dateRetourReelle;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutEmprunt statut = StatutEmprunt.EN_COURS;

    @Builder.Default
    private Double penalite = 0.0;

    @PrePersist
    protected void onCreate() {
        dateEmprunt = LocalDate.now();
        dateRetourPrevue = dateEmprunt.plusDays(14);
    }

    public void calculerPenalite() {
        if (statut == StatutEmprunt.RENDU && dateRetourReelle != null && dateRetourReelle.isAfter(dateRetourPrevue)) {
            long joursRetard = ChronoUnit.DAYS.between(dateRetourPrevue, dateRetourReelle);
            penalite = joursRetard * 100.0;
        } else if (statut == StatutEmprunt.EN_COURS && LocalDate.now().isAfter(dateRetourPrevue)) {
            long joursRetard = ChronoUnit.DAYS.between(dateRetourPrevue, LocalDate.now());
            penalite = joursRetard * 100.0;
        }
    }

    public boolean isEnRetard() {
        return statut == StatutEmprunt.EN_COURS && LocalDate.now().isAfter(dateRetourPrevue);
    }

    public enum StatutEmprunt {
        EN_COURS, RENDU, RETARD, PERDU
    }
}