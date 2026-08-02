package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "annees_academiques", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"libelle", "universite_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnneeAcademique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String libelle;

    @Column(nullable = false)
    private boolean active;

    @Builder.Default
    private boolean cloturee = false;

    // ── RELATION AVEC UNIVERSITE ──
    @ManyToOne
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    // ── Constructeurs supplémentaires (pour compatibilité) ──

    public AnneeAcademique(String libelle, boolean active) {
        this.libelle = libelle;
        this.active = active;
        this.cloturee = false;
    }

    public AnneeAcademique(String libelle, boolean active, boolean cloturee) {
        this.libelle = libelle;
        this.active = active;
        this.cloturee = cloturee;
    }

    public AnneeAcademique(String libelle, boolean active, Universite universite) {
        this.libelle = libelle;
        this.active = active;
        this.universite = universite;
    }
}