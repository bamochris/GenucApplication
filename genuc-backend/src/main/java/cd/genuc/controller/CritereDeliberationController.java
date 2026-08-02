package cd.genuc.controller;

import cd.genuc.model.CritereDeliberation;
import cd.genuc.service.CritereDeliberationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/criteres-deliberation")
@RequiredArgsConstructor
public class CritereDeliberationController {

    private final CritereDeliberationService critereService;

    @GetMapping("/promotion/{promotionId}/annee/{anneeId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<?> getCritere(@PathVariable Long promotionId,
                                        @PathVariable Long anneeId) {
        return critereService.getCritereParPromotionEtAnnee(promotionId, anneeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<?> creerOuModifier(@RequestBody CritereDeliberation critere) {
        try {
            return ResponseEntity.ok(critereService.creerOuModifier(critere));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}