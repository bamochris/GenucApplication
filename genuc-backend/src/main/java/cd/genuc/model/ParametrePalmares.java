package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "parametres_palmares")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParametrePalmares {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "universite_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @Column(nullable = false)
    private String anneeAcademique;

    @Column(columnDefinition = "TEXT")
    private String niveauxCibles;

    @Builder.Default
    private Double seuilMoyenne = 14.0;
    @Builder.Default
    private Integer topNParFiliere = 3;

    private LocalDate dateGeneration;
    @Builder.Default
    private Boolean autoGeneration = false;

    private String emailTemplate;

    @Column(updatable = false)
    private LocalDateTime creeLe;

    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
    }
}