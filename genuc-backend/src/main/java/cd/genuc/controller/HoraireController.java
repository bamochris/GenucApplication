package cd.genuc.controller;

import cd.genuc.model.Horaire;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.HoraireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/horaires")
@RequiredArgsConstructor
public class HoraireController {

    private final HoraireService horaireService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE', 'APPARITEUR')")
    public ResponseEntity<?> creerHoraire(@RequestBody Horaire horaire) {
        try {
            return ResponseEntity.ok(horaireService.creerHoraire(horaire));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    /**
     * L'université n'est PAS un paramètre de la requête : elle est lue sur le compte appelant.
     * Un libellé de promotion étant commun à tous les établissements, l'accepter depuis le
     * client laisserait n'importe quel utilisateur authentifié consulter l'emploi du temps
     * d'une autre université.
     */
    @GetMapping("/promotion/{promotion}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getHorairesPromotion(@PathVariable String promotion,
                                                  @AuthenticationPrincipal Utilisateur utilisateur) {
        Long universiteId = utilisateur != null ? utilisateur.getUniversiteId() : null;
        if (universiteId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Aucun établissement rattaché à ce compte."));
        }
        List<Horaire> horaires = horaireService.getHorairesParPromotion(universiteId, promotion);
        return ResponseEntity.ok(horaires);
    }

    @GetMapping("/salle/{salleId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'APPARITEUR')")
    public ResponseEntity<?> getHorairesSalle(@PathVariable Long salleId,
                                              @AuthenticationPrincipal Utilisateur utilisateur) {
        Long universiteId = utilisateur != null ? utilisateur.getUniversiteId() : null;
        if (universiteId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Aucun établissement rattaché à ce compte."));
        }
        List<Horaire> horaires = horaireService.getHorairesParSalle(universiteId, salleId);
        return ResponseEntity.ok(horaires);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'APPARITEUR')")
    public ResponseEntity<?> supprimer(@PathVariable Long id) {
        horaireService.supprimerHoraire(id);
        return ResponseEntity.ok(Map.of("message", "Horaire supprimé"));
    }
}
