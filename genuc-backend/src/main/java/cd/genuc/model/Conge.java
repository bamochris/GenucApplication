package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "conges")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String libelle;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = false)
    private LocalDate dateFin;

    @Column(nullable = false)
    private Integer nbJoursOuvrables;

    @ManyToOne
    @JoinColumn(name = "personnel_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Personnel personnel;

    @Column(nullable = false)
    private Long demandeurId;

    private Long valideParId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutConge statut = StatutConge.EN_ATTENTE;

    private String motifRejet;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    private LocalDate dateValidation;
    private LocalDate dateDemande;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        dateDemande = LocalDate.now();
        if (dateDebut != null && dateFin != null) {
            nbJoursOuvrables = calculerJoursOuvrables(dateDebut, dateFin);
        }
    }

    public enum StatutConge {
        EN_ATTENTE, VALIDE, REJETE, TERMINE
    }

    private Integer calculerJoursOuvrables(LocalDate debut, LocalDate fin) {
        int jours = 0;
        LocalDate current = debut;
        while (!current.isAfter(fin)) {
            if (current.getDayOfWeek().getValue() <= 5) {
                jours++;
            }
            current = current.plusDays(1);
        }
        return jours;
    }
}