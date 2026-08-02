package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cours_vacations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoursVacation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String jour; // Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi

    @Column(nullable = false)
    private String heureDebut; // ex: "08:00"

    @Column(nullable = false)
    private String heureFin; // ex: "10:00"

    @Column(length = 100)
    private String salle;

    @Builder.Default
    private boolean actif = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacation_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Vacation vacation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professeur_id")
    @JsonIgnore
    @ToString.Exclude
    private Utilisateur professeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Promotion promotion;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }
}
