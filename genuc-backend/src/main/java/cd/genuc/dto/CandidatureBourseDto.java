package cd.genuc.dto;

import cd.genuc.model.CandidatureBourse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidatureBourseDto {
    private Long id;
    private Long bourseId;
    private BourseOffreDto bourse;
    private Long etudiantId;
    private String etudiantNom;
    private String etudiantPrenom;
    private String etudiantMatricule;
    private String motivation;
    private String pieceJustificativeUrl;
    private LocalDate dateDemande;
    private CandidatureBourse.StatutCandidature statut;
    private String motifRejet;
    private LocalDateTime dateDecision;

    public static CandidatureBourseDto fromEntity(CandidatureBourse c) {
        if (c == null) return null;
        CandidatureBourseDtoBuilder b = CandidatureBourseDto.builder()
                .id(c.getId())
                .motivation(c.getMotivation())
                .pieceJustificativeUrl(c.getPieceJustificativeUrl())
                .dateDemande(c.getDateDemande())
                .statut(c.getStatut())
                .motifRejet(c.getMotifRejet())
                .dateDecision(c.getDateDecision());
        if (c.getBourseOffre() != null) {
            b.bourseId(c.getBourseOffre().getId())
             .bourse(BourseOffreDto.fromEntity(c.getBourseOffre()));
        }
        if (c.getEtudiant() != null) {
            b.etudiantId(c.getEtudiant().getId())
             .etudiantNom(c.getEtudiant().getNom())
             .etudiantPrenom(c.getEtudiant().getPrenom())
             .etudiantMatricule(c.getEtudiant().getMatriculePermanent());
        }
        return b.build();
    }
}
