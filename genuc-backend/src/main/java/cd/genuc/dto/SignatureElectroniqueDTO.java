package cd.genuc.dto;

import cd.genuc.model.SignatureElectronique;
import cd.genuc.model.TypeDocumentSignable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignatureElectroniqueDTO {
    private Long id;
    private TypeDocumentSignable typeDocument;
    private Long documentId;

    private Long signataireId;
    private String signataireNom;
    private String signataireFonction;

    private Long appliqueParId;
    private String appliqueParNom;

    private String hashDocument;
    private String codeVerification;
    private LocalDateTime dateSignature;
    private boolean revoquee;
    private String motifRevocation;

    public static SignatureElectroniqueDTO fromEntity(SignatureElectronique s) {
        SignatureElectroniqueDTOBuilder builder = SignatureElectroniqueDTO.builder()
                .id(s.getId())
                .typeDocument(s.getTypeDocument())
                .documentId(s.getDocumentId())
                .appliqueParId(s.getAppliqueParId())
                .appliqueParNom(s.getAppliqueParNom())
                .hashDocument(s.getHashDocument())
                .codeVerification(s.getCodeVerification())
                .dateSignature(s.getDateSignature())
                .revoquee(s.isRevoquee())
                .motifRevocation(s.getMotifRevocation());

        if (s.getSignataire() != null) {
            builder.signataireId(s.getSignataire().getId());
            builder.signataireNom(s.getSignataire().getNomComplet());
            builder.signataireFonction(s.getSignataire().getFonction());
        }

        return builder.build();
    }
}
