package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "conferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TypeConference type = TypeConference.CONFERENCE;

    private LocalDate date;

    private String lieu;

    private String organisateur;

    private String lien;

    @ManyToOne
    @JoinColumn(name = "professeur_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Utilisateur professeur;

    @Column(name = "professeur_id", insertable = false, updatable = false)
    private Long professeurId;

    private String professeurNom;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    public enum TypeConference {
        CONFERENCE, SEMINAIRE, ATELIER, COLLOQUE
    }
}
