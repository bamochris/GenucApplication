package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "etudiants")
public class Etudiant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String matriculePermanent;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false, unique = true)
    private String email;

    private String telephone;
    private LocalDate dateNaissance;
    private String lieuNaissance;
    private String sexe;
    private String adresse;

    @Builder.Default
    private boolean actif = true;

    @Builder.Default
    private boolean archive = false;

    // Champ pour la photo (ajouté pour le palmarès)
    private String photoUrl;

    /**
     * Mot de passe choisi par l'étudiant lors de l'inscription publique.
     * Stocké temporairement — utilisé pour créer le compte Utilisateur
     * lors de la validation du dossier par l'admin.
     * Non exposé en JSON pour la sécurité.
     */
    @JsonIgnore
    @Column(name = "mot_de_passe_temporaire")
    private String motDePasseTemporaire;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @JsonIgnore
    @OneToMany(mappedBy = "etudiant")
    @ToString.Exclude
    private List<Inscription> inscriptions;

    @PrePersist
    public void onCreate() {
        creeLe = LocalDateTime.now();
    }
}
