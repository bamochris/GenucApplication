package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "inscriptions")
public class Inscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    
    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @Column(name = "lieu_naissance")
    private String lieuNaissance;

    private String sexe;
    
    @Column(columnDefinition = "TEXT")
    private String adresse;

    private String niveau;

    @Column(unique = true, length = 30)
    private String matricule;

    private Long dossierInscriptionId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutInscription statut = StatutInscription.EN_ATTENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Etudiant etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departement_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Departement departement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filiere_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Filiere filiere;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annee_academique_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private AnneeAcademique anneeAcademique;

    @Builder.Default
    private boolean bulletin = false;

    @Builder.Default
    private boolean photo = false;

    @Builder.Default
    private boolean acte = false;
    
    @Builder.Default
    private boolean archive = false;

    private String commentaire;
    
    @Column(name = "motif_rejet")
    private String motifRejet;

    // ✅ Correction : annotation pour correspondre à la colonne SQL
    @Column(name = "cree_le", updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        this.creeLe = LocalDateTime.now();
    }

    public boolean estValidee() {
        return statut == StatutInscription.VALIDE;
    }

    public boolean estEnAttente() {
        return statut == StatutInscription.EN_ATTENTE;
    }

    public boolean estRejetee() {
        return statut == StatutInscription.REJETE;
    }

    public void valider() {
        this.statut = StatutInscription.VALIDE;
    }

    public void rejeter(String motif) {
        this.statut = StatutInscription.REJETE;
        this.motifRejet = motif;
    }

    public String getNomComplet() {
        return (prenom != null ? prenom : "") + " " + (nom != null ? nom : "");
    }
}