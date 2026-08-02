package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "personnel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Personnel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(unique = true, nullable = false)
    private String email;

    private String telephone;

    private LocalDate dateNaissance;
    private String lieuNaissance;
    private String sexe;
    private String adresse;

    @Column(unique = true)
    private String matriculePersonnel;

    @Enumerated(EnumType.STRING)
    private TypePersonnel type;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutPersonnel statut = StatutPersonnel.ACTIF;

    @ManyToOne
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @ManyToOne
    @JoinColumn(name = "departement_id")
    @JsonIgnore
    @ToString.Exclude
    private Departement departement;

    private String specialite;
    private String grade;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate dateEmbauche;
    private LocalDate dateFinContrat;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (matriculePersonnel == null) {
            matriculePersonnel = genererMatricule();
        }
    }

    private String genererMatricule() {
        int annee = LocalDate.now().getYear();
        return String.format("PERS-%d-%06d", annee, System.currentTimeMillis() % 1000000);
    }

    public enum TypePersonnel {
        ENSEIGNANT, ADMINISTRATIF, OUVRIER, STAGIAIRE
    }

    public enum StatutPersonnel {
        ACTIF, INACTIF, CONGE, RETRAITE
    }
}