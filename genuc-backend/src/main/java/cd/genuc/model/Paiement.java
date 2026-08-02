package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "paiements")
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(unique = true, nullable = false)
    private String reference;

    @Column(nullable = false)
    private Double montant;

    @Column(length = 5)
    @Builder.Default
    private String devise = "USD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModePaiement modePaiement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutPaiement statut = StatutPaiement.EN_ATTENTE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypePaiement type;

    private LocalDate datePaiement;
    private LocalDate dateValidation;
    private String numeroTransaction;
    private String operateur;
    private String notesCaisse;
    private String motifRejet;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (datePaiement == null) datePaiement = LocalDate.now();
        if (reference == null) {
            reference = genererReference();
        }
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    private Long agentId;

    @OneToMany(mappedBy = "paiement", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @Builder.Default
    private List<AffectationFrais> affectations = new ArrayList<>();

    public enum ModePaiement {
        ESPECES, MOBILE_MONEY, VIREMENT, CHEQUE, CARTE_BANCAIRE,
        /**
         * Dépôt d'espèces au guichet d'une banque partenaire, sur le compte de
         * l'établissement — distinct de {@link #VIREMENT} (transfert de compte à
         * compte) et de {@link #ESPECES} (encaissement à la caisse de l'université,
         * qui déclenche la logique caissier). C'est le canal le plus courant pour un
         * étudiant sans compte bancaire.
         *
         * <p>Aucune migration n'est requise : {@code mode_paiement} est un
         * {@code varchar(30)} sans contrainte d'énumération en base.</p>
         */
        DEPOT_BANCAIRE
    }

    public enum StatutPaiement {
        EN_ATTENTE, VALIDE, REJETE, REMBOURSE
    }

    public enum TypePaiement {
        FRAIS_INSCRIPTION, FRAIS_ACADEMIQUES, FRAIS_EXAMEN,
        FRAIS_BIBLIOTHEQUE, FRAIS_DIPLOME, FRAIS_RELEVE, AUTRE
    }

    public void addAffectation(AffectationFrais affectation) {
        if (affectations == null) {
            affectations = new ArrayList<>();
        }
        affectations.add(affectation);
        affectation.setPaiement(this);
    }

    public void addAffectations(List<AffectationFrais> affectations) {
        if (this.affectations == null) {
            this.affectations = new ArrayList<>();
        }
        for (AffectationFrais af : affectations) {
            this.affectations.add(af);
            af.setPaiement(this);
        }
    }

    private String genererReference() {
        int annee = LocalDate.now().getYear();
        return String.format("REC-%d-%06d", annee, System.currentTimeMillis() % 1000000);
    }

    public boolean estValide() {
        return statut == StatutPaiement.VALIDE;
    }

    public double getTotalAffectations() {
        if (affectations == null || affectations.isEmpty()) {
            return 0.0;
        }
        return affectations.stream()
                .mapToDouble(AffectationFrais::getMontant)
                .sum();
    }

    public int getNbAffectations() {
        return affectations != null ? affectations.size() : 0;
    }

    public List<String> getMatriculesConcerning() {
        if (affectations == null || affectations.isEmpty()) {
            return List.of();
        }
        return affectations.stream()
                .map(af -> af.getInscription().getMatricule())
                .distinct()
                .collect(java.util.stream.Collectors.toList());
    }
}