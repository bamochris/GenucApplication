package cd.genuc.dto;

import cd.genuc.model.Reservation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ReservationResponseDto - Vue plate d'une Reservation exposant l'identité du livre et
 * de l'étudiant (sans exposer les entités JPA complètes, cf. EmpruntResponseDto).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationResponseDto {
    private Long id;

    private Long livreId;
    private String livreTitre;
    private String livreAuteur;

    private Long etudiantId;
    private String etudiantNom;
    private String etudiantPrenom;
    private String etudiantMatricule;

    private LocalDate dateReservation;
    private LocalDate dateExpiration;
    private Reservation.StatutReservation statut;
    private LocalDateTime creeLe;

    public static ReservationResponseDto fromEntity(Reservation r) {
        if (r == null) return null;
        ReservationResponseDtoBuilder b = ReservationResponseDto.builder()
                .id(r.getId())
                .dateReservation(r.getDateReservation())
                .dateExpiration(r.getDateExpiration())
                .statut(r.getStatut())
                .creeLe(r.getCreeLe());
        if (r.getLivre() != null) {
            b.livreId(r.getLivre().getId())
             .livreTitre(r.getLivre().getTitre())
             .livreAuteur(r.getLivre().getAuteur());
        }
        if (r.getEtudiant() != null) {
            b.etudiantId(r.getEtudiant().getId())
             .etudiantNom(r.getEtudiant().getNom())
             .etudiantPrenom(r.getEtudiant().getPrenom())
             .etudiantMatricule(r.getEtudiant().getMatriculePermanent());
        }
        return b.build();
    }
}
