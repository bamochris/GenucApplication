package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "salles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Salle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    private Integer capacite;
    private String batiment;
    private String etage;
    private String code;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TypeSalle type = TypeSalle.COURS;

    @Builder.Default
    private boolean estDisponible = true;

    @ManyToOne
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    public enum TypeSalle {
        COURS, LABO, AUDITOIRE, BIBLIOTHEQUE, REUNION
    }
}