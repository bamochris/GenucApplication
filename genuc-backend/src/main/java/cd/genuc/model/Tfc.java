package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tfc")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tfc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sujet_ref_id")
    @JsonIgnore
    @ToString.Exclude
    private SujetTfc sujetRef;

    @Column(nullable = false)
    private String sujet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TypeTfc type = TypeTfc.MEMOIRE;

    private String anneeAcademique;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutTfc statut = StatutTfc.EN_COURS;

    @Column(nullable = false)
    private Long professeurId;

    private String professeurNom;

    private LocalDate dateLimite;

    @Builder.Default
    private Integer progression = 0;

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateSoutenance;

    private String motifRejet;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        if (anneeAcademique == null) {
            int annee = java.time.LocalDate.now().getYear();
            anneeAcademique = annee + "-" + (annee + 1);
        }
    }

    public enum TypeTfc {
        MEMOIRE, TFC, THESE
    }

    public enum StatutTfc {
        EN_ATTENTE, EN_COURS, SOUTENU, VALIDE, REJETE
    }
}
