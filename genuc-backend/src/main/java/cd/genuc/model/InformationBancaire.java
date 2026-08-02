package cd.genuc.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "informations_bancaires")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InformationBancaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @ToString.Exclude
    private Universite universite;

    @Column(nullable = false)
    private String nomBanque; // ex: "Banque Commerciale du Congo (BCC)"

    @Column(nullable = false)
    private String intituleCompte; // ex: "UNIVERSITÉ DE KINSHASA - FRAIS ACADEMIQUES"

    @Column(nullable = false)
    private String numeroCompte;

    @Column(nullable = false, length = 10)
    private String devise; // "USD" ou "CDF"

    private String codeBanque;
    private String swiftCode;
    private String iban;

    @Column(columnDefinition = "TEXT")
    private String instructionsPaiement;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }
}
