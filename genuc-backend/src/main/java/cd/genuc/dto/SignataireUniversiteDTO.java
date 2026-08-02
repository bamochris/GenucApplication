package cd.genuc.dto;

import cd.genuc.model.RoleEnum;
import cd.genuc.model.SignataireUniversite;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignataireUniversiteDTO {
    private Long id;
    private Long universiteId;
    private String nomComplet;
    private String fonction;
    private RoleEnum roleRattache;
    private Long utilisateurId;
    private String signatureImage;
    private boolean actif;
    private LocalDateTime creeLe;
    private LocalDateTime modifieLe;

    public static SignataireUniversiteDTO fromEntity(SignataireUniversite s) {
        return SignataireUniversiteDTO.builder()
                .id(s.getId())
                .universiteId(s.getUniversite() != null ? s.getUniversite().getId() : null)
                .nomComplet(s.getNomComplet())
                .fonction(s.getFonction())
                .roleRattache(s.getRoleRattache())
                .utilisateurId(s.getUtilisateurId())
                .signatureImage(s.getSignatureImage())
                .actif(s.isActif())
                .creeLe(s.getCreeLe())
                .modifieLe(s.getModifieLe())
                .build();
    }
}
