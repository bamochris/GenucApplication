package cd.genuc.dto;

import cd.genuc.model.Emprunt;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * EmpruntResponseDto - Vue plate d'un Emprunt exposant l'identité du livre et de
 * l'étudiant (sans exposer les entités JPA complètes ni risquer de cycle de
 * sérialisation / LazyInitializationException hors contexte de transaction).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmpruntResponseDto {
    private Long id;

    private Long livreId;
    private String livreTitre;
    private String livreAuteur;

    private Long etudiantId;
    private String etudiantNom;
    private String etudiantPrenom;
    private String etudiantMatricule;

    private LocalDate dateEmprunt;
    private LocalDate dateRetourPrevue;
    private LocalDate dateRetourReelle;
    private Emprunt.StatutEmprunt statut;
    private Double penalite;
    private boolean enRetard;

    public static EmpruntResponseDto fromEntity(Emprunt e) {
        if (e == null) return null;
        EmpruntResponseDtoBuilder b = EmpruntResponseDto.builder()
                .id(e.getId())
                .dateEmprunt(e.getDateEmprunt())
                .dateRetourPrevue(e.getDateRetourPrevue())
                .dateRetourReelle(e.getDateRetourReelle())
                .statut(e.getStatut())
                .penalite(e.getPenalite())
                .enRetard(e.isEnRetard());
        if (e.getLivre() != null) {
            b.livreId(e.getLivre().getId())
             .livreTitre(e.getLivre().getTitre())
             .livreAuteur(e.getLivre().getAuteur());
        }
        if (e.getEtudiant() != null) {
            b.etudiantId(e.getEtudiant().getId())
             .etudiantNom(e.getEtudiant().getNom())
             .etudiantPrenom(e.getEtudiant().getPrenom())
             .etudiantMatricule(e.getEtudiant().getMatriculePermanent());
        }
        return b.build();
    }
}
