// cd.genuc.model.ServiceUniversite.java
package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "services_universite")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceUniversite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(length = 20)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TypeService type = TypeService.SCOLARITE;

    private String responsableNom;

    private String responsableEmail;

    private String telephone;

    @Builder.Default
    private boolean actif = true;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universite_id", nullable = false)
    @ToString.Exclude
    private Universite universite;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }

    public enum TypeService {
        PAIEMENT,
        SCOLARITE,
        BIBLIOTHEQUE,
        INFORMATIQUE,
        RELATIONS_EXTERIEURES,
        RECHERCHE,
        VIE_ETUDIANTE
    }
}