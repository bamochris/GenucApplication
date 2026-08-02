// src/main/java/cd/genuc/controller/RapportFinancierController.java
package cd.genuc.controller;

import cd.genuc.model.Utilisateur;
import cd.genuc.service.RapportFinancierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rapports/financiers")
@RequiredArgsConstructor
public class RapportFinancierController {

    private final RapportFinancierService rapportService;

    @GetMapping("/dettes")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN', 'RECTEUR')")
    public ResponseEntity<?> getDettes(@AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.ok(rapportService.getDettesEtudiantes(user.getUniversiteId()));
    }

    @GetMapping("/taux-recouvrement")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN', 'RECTEUR')")
    public ResponseEntity<?> getTauxRecouvrement(@AuthenticationPrincipal Utilisateur user,
                                                 @RequestParam(required = false) String annee) {
        if (annee == null || annee.isEmpty()) {
            int year = java.time.LocalDate.now().getYear();
            annee = year + "-" + (year + 1);
        }
        return ResponseEntity.ok(rapportService.getTauxRecouvrement(user.getUniversiteId(), annee));
    }

    @GetMapping("/par-faculte")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN', 'RECTEUR')")
    public ResponseEntity<?> getPaiementsParFaculte(@AuthenticationPrincipal Utilisateur user,
                                                    @RequestParam(required = false) String annee) {
        if (annee == null || annee.isEmpty()) {
            int year = java.time.LocalDate.now().getYear();
            annee = year + "-" + (year + 1);
        }
        return ResponseEntity.ok(rapportService.getPaiementsParFaculte(user.getUniversiteId(), annee));
    }

    @GetMapping("/par-promotion")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN', 'RECTEUR')")
    public ResponseEntity<?> getPaiementsParPromotion(@AuthenticationPrincipal Utilisateur user,
                                                      @RequestParam(required = false) String annee) {
        if (annee == null || annee.isEmpty()) {
            int year = java.time.LocalDate.now().getYear();
            annee = year + "-" + (year + 1);
        }
        return ResponseEntity.ok(rapportService.getPaiementsParPromotion(user.getUniversiteId(), annee));
    }

    @GetMapping("/evolution")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN', 'RECTEUR')")
    public ResponseEntity<?> getEvolution(@AuthenticationPrincipal Utilisateur user,
                                          @RequestParam(defaultValue = "0") int annee) {
        if (annee == 0) {
            annee = java.time.LocalDate.now().getYear();
        }
        return ResponseEntity.ok(rapportService.getEvolutionRecettes(user.getUniversiteId(), annee));
    }

    @GetMapping("/previsions")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN', 'RECTEUR')")
    public ResponseEntity<?> getPrevisions(@AuthenticationPrincipal Utilisateur user,
                                           @RequestParam(required = false) String annee) {
        if (annee == null || annee.isEmpty()) {
            int year = java.time.LocalDate.now().getYear();
            annee = year + "-" + (year + 1);
        }
        return ResponseEntity.ok(rapportService.getPrevisionsFinancieres(user.getUniversiteId(), annee));
    }
}