package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents_etudiants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentEtudiant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "etudiant_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Etudiant etudiant;

    @Enumerated(EnumType.STRING)
    private TypeDocument type;

    private String nomFichier;
    private String url;

    @Builder.Default
    private boolean valide = false;
    private LocalDateTime dateUpload;

    @PrePersist
    protected void onCreate() {
        dateUpload = LocalDateTime.now();
    }

    public enum TypeDocument {
        PHOTO_IDENTITE, DIPLOME_ETAT, RELEVE_NOTES, ATTESTATION_CONDUITE,
        ATTESTATION_PHYSIQUE, ACTE_NAISSANCE, CARTE_IDENTITE, PASSEPORT, AUTRE
    }
}