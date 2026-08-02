package cd.genuc.dto;

import cd.genuc.model.RegleSignatureDocument;
import cd.genuc.model.TypeDocumentSignable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegleSignatureDocumentDTO {
    private Long id;
    private Long universiteId;
    private TypeDocumentSignable typeDocument;
    private Long signataireId;
    private String signataireNom;
    private String signataireFonction;

    public static RegleSignatureDocumentDTO fromEntity(RegleSignatureDocument r) {
        RegleSignatureDocumentDTOBuilder builder = RegleSignatureDocumentDTO.builder()
                .id(r.getId())
                .typeDocument(r.getTypeDocument());

        if (r.getUniversite() != null) {
            builder.universiteId(r.getUniversite().getId());
        }
        if (r.getSignataire() != null) {
            builder.signataireId(r.getSignataire().getId());
            builder.signataireNom(r.getSignataire().getNomComplet());
            builder.signataireFonction(r.getSignataire().getFonction());
        }

        return builder.build();
    }
}
