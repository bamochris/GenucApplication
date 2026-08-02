package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "publications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Publication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private String auteurs;

    private String revue;

    private Integer annee;

    private String doi;

    @Column(columnDefinition = "TEXT")
    private String resume;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TypePublication type = TypePublication.ARTICLE;

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

    public enum TypePublication {
        ARTICLE, LIVRE, CHAPITRE, CONFERENCE, RAPPORT
    }
}
