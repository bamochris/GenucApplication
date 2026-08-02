package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "commentaires_tfc")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentaireTfc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tfc_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Tfc tfc;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String texte;

    private Long auteurId;
    private String auteurNom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TypeCommentaire type = TypeCommentaire.NEUTRE;

    @Column(updatable = false)
    private LocalDateTime date;

    @PrePersist
    protected void onCreate() {
        date = LocalDateTime.now();
    }

    public enum TypeCommentaire {
        POSITIF, NEGATIF, NEUTRE
    }
}
