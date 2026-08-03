package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "presences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Presence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cours_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Cours cours;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Etudiant etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seance_id")
    @JsonIgnore
    @ToString.Exclude
    private SeanceLive seance;

    @Column(nullable = false)
    private LocalDate dateCours;

    private LocalTime heureArrivee;
    
    @Column(nullable = false)
    @Builder.Default
    private boolean present = false;
    
    @Builder.Default
    private boolean justifie = false;

    @Column(columnDefinition = "TEXT")
    private String motifAbsence;

    private String codeQrScanne;
    private LocalDateTime scanTimestamp;
    // Pas de champ qrExpiration : l'expiration est portée par le payload du QR
    // lui-même et vérifiée au scan. La persister n'apportait rien et ajoutait
    // une colonne qui, faute de migration Flyway correspondante, aurait fait
    // échouer le démarrage en production (ddl-auto=validate).

    @PrePersist
    protected void onCreate() {
        if (dateCours == null) dateCours = LocalDate.now();
        if (heureArrivee == null) heureArrivee = LocalTime.now();
        scanTimestamp = LocalDateTime.now();
    }

    public boolean isAbsent() {
        return !present && !justifie;
    }
    
    public boolean isRetard() {
        return present && heureArrivee != null && heureArrivee.isAfter(LocalTime.of(8, 15));
    }
    
    public String getStatutLibelle() {
        if (present) {
            return isRetard() ? "En retard" : "Présent";
        }
        return justifie ? "Absence justifiée" : "Absent";
    }
}