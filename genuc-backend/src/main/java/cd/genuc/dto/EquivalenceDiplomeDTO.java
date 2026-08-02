package cd.genuc.dto;

import cd.genuc.model.EquivalenceDiplome;
import cd.genuc.model.EquivalenceDiplome.StatutEquivalence;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquivalenceDiplomeDTO {
    private Long id;

    private Long etudiantId;
    private String etudiantNom;
    private String etudiantPrenom;
    private String etudiantMatricule;

    private Long universiteId;
    private String universiteNom;

    private String etablissementOrigine;
    private String paysOrigine;
    private String diplomeObtenu;
    private String domaineEtude;
    private Integer anneeObtention;
    private String niveauObtenu;

    private Long filiereDemandeeId;
    private String filiereDemandeeNom;
    private String niveauDemande;

    private String diplomeDocumentUrl;
    private String releveNotesDocumentUrl;

    private StatutEquivalence statut;
    private String decisionMotif;
    private String niveauAccorde;
    private Long traiteParId;

    private LocalDateTime dateSoumission;
    private LocalDateTime dateDecision;

    public static EquivalenceDiplomeDTO fromEntity(EquivalenceDiplome e) {
        EquivalenceDiplomeDTOBuilder builder = EquivalenceDiplomeDTO.builder()
                .id(e.getId())
                .etablissementOrigine(e.getEtablissementOrigine())
                .paysOrigine(e.getPaysOrigine())
                .diplomeObtenu(e.getDiplomeObtenu())
                .domaineEtude(e.getDomaineEtude())
                .anneeObtention(e.getAnneeObtention())
                .niveauObtenu(e.getNiveauObtenu())
                .niveauDemande(e.getNiveauDemande())
                .diplomeDocumentUrl(e.getDiplomeDocumentUrl())
                .releveNotesDocumentUrl(e.getReleveNotesDocumentUrl())
                .statut(e.getStatut())
                .decisionMotif(e.getDecisionMotif())
                .niveauAccorde(e.getNiveauAccorde())
                .traiteParId(e.getTraiteParId())
                .dateSoumission(e.getDateSoumission())
                .dateDecision(e.getDateDecision());

        if (e.getEtudiant() != null) {
            builder.etudiantId(e.getEtudiant().getId());
            builder.etudiantNom(e.getEtudiant().getNom());
            builder.etudiantPrenom(e.getEtudiant().getPrenom());
            builder.etudiantMatricule(e.getEtudiant().getMatriculePermanent());
        }
        if (e.getUniversite() != null) {
            builder.universiteId(e.getUniversite().getId());
            builder.universiteNom(e.getUniversite().getNom());
        }
        if (e.getFiliereDemandee() != null) {
            builder.filiereDemandeeId(e.getFiliereDemandee().getId());
            builder.filiereDemandeeNom(e.getFiliereDemandee().getNom());
        }

        return builder.build();
    }
}
