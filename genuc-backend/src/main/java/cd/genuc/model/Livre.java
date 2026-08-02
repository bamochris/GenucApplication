package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "livres")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Livre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private String auteur;
    private String isbn;
    private String editeur;
    private Integer anneePublication;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String categorie;
    private String emplacement;
    private String couvertureUrl;
    private String fichierPdfUrl;

    @Builder.Default
    private Integer quantiteTotale = 1;

    @Builder.Default
    private Integer quantiteDisponible = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id")
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @Builder.Default
    private boolean actif = true;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    public boolean isDisponible() {
        return quantiteDisponible != null && quantiteDisponible > 0;
    }
}
