package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
// @Table(name = "ouvrages")  ← À SUPPRIMER
@DiscriminatorValue("OUVRAGE")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ouvrage extends Livre {

    @Enumerated(EnumType.STRING)
    private TypeOuvrage typeOuvrage = TypeOuvrage.LIVRE;

    private String editeur;
    private String collection;
    private String langue = "Français";
    private Integer nbPages;
    private String resume;

    // Pour les thèses/mémoires
    private String directeurMemoire;
    private String universiteOrigine;
    private Integer anneeSoutenance;

    public enum TypeOuvrage {
        LIVRE, REVUE, MEMOIRE, THESE
    }
}