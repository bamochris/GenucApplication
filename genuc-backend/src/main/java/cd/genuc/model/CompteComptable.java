package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "comptes_comptables")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompteComptable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false)
    private String libelle;

    @Enumerated(EnumType.STRING)
    private TypeCompte type;

    @Builder.Default
    private Double soldeInitial = 0.0;

    @Builder.Default
    private boolean actif = true;

    private Long universiteId;

    public enum TypeCompte {
        ACTIF, PASSIF, CHARGE, PRODUIT
    }
}