package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "baremes_paiement")
public class BaremePaiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String anneeAcademique;

    @Column(nullable = false)
    private String niveau;

    @Enumerated(EnumType.STRING)
    private Paiement.TypePaiement typePaiement;

    @Column(nullable = false)
    private Double montantAttendu;

    @Builder.Default
    private String devise = "USD";

    private Long departementId;

    @Builder.Default
    private boolean actif = true;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() { 
        creeLe = LocalDateTime.now(); 
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;
}