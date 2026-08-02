package cd.genuc.dto;

import cd.genuc.model.LettreAcceptation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 📄 DTO pour la Lettre d'Acceptation
 * Avec en-tête MINESU (République Démocratique du Congo)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LettreAcceptationDTO {
    private Long id;
    private String numeroLettre;
    private String contenu;
    private boolean emise;
    private LocalDate dateEmission;
    private String uuidVerification;

    private Long inscriptionVacationId;
    private String inscriptionVacationStatut;

    private Long etudiantId;
    private String etudiantNom;
    private String etudiantPrenom;
    private String etudiantMatricule;

    private Long universiteId;
    private String universiteNom;
    private String universiteCode;
    private String universiteVille;
    private String recteurNom;

    private Long vacationId;
    private String vacationNom;
    private String vacationType;
    private LocalDate vacationDateDebut;
    private LocalDate vacationDateFin;

    // Renseignés uniquement par verifierLettre() — la lettre a une signature électronique
    private boolean signeElectroniquement;
    private String signataire;
    private String signataireFonction;
    private java.time.LocalDateTime dateSignature;
    private boolean signatureRevoquee;
    private String motifRevocation;

    private String promotionNom;
    private String filiereNom;

    private LocalDateTime creeLe;
    private LocalDateTime modifieLe;

    public static LettreAcceptationDTO fromEntity(LettreAcceptation la) {
        LettreAcceptationDTOBuilder builder = LettreAcceptationDTO.builder()
                .id(la.getId())
                .numeroLettre(la.getNumeroLettre())
                .contenu(la.getContenu())
                .emise(la.isEmise())
                .dateEmission(la.getDateEmission())
                .uuidVerification(la.getUuidVerification())
                .creeLe(la.getCreeLe())
                .modifieLe(la.getModifieLe());

        if (la.getInscriptionVacation() != null) {
            builder.inscriptionVacationId(la.getInscriptionVacation().getId());
            if (la.getInscriptionVacation().getStatut() != null) {
                builder.inscriptionVacationStatut(la.getInscriptionVacation().getStatut().name());
            }
        }

        if (la.getEtudiant() != null) {
            builder.etudiantId(la.getEtudiant().getId());
            builder.etudiantNom(la.getEtudiant().getNom());
            builder.etudiantPrenom(la.getEtudiant().getPrenom());
            builder.etudiantMatricule(la.getEtudiant().getMatriculePermanent());
        }

        if (la.getUniversite() != null) {
            builder.universiteId(la.getUniversite().getId());
            builder.universiteNom(la.getUniversite().getNom());
            builder.universiteCode(la.getUniversite().getCode());
            builder.universiteVille(la.getUniversite().getVille());
            builder.recteurNom(la.getUniversite().getRecteurNom());
        }

        if (la.getVacation() != null) {
            builder.vacationId(la.getVacation().getId());
            builder.vacationNom(la.getVacation().getNom());
            builder.vacationType(la.getVacation().getType().name());
            builder.vacationDateDebut(la.getVacation().getDateDebut());
            builder.vacationDateFin(la.getVacation().getDateFin());
        }

        // Promotion & Filière via l'inscription vacation
        if (la.getInscriptionVacation() != null && la.getInscriptionVacation().getPromotion() != null) {
            builder.promotionNom(la.getInscriptionVacation().getPromotion().getLibelle());
            if (la.getInscriptionVacation().getPromotion().getFiliere() != null) {
                builder.filiereNom(la.getInscriptionVacation().getPromotion().getFiliere().getNom());
            }
        }

        return builder.build();
    }
}
