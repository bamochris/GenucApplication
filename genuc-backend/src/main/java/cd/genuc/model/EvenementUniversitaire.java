package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Événement de vie universitaire (conférence, tournoi, activité de club, etc.).
 */
@Entity
@Table(name = "evenements_universitaires")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvenementUniversitaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate date;

    private String heure;

    private String lieu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "association_id")
    @JsonIgnore
    @ToString.Exclude
    private Association association;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    private Long creeParUtilisateurId;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }
}
