package cd.genuc.controller;

import cd.genuc.service.ChefPromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chef-promotion")
@RequiredArgsConstructor
public class ChefPromotionController {

    private final ChefPromotionService chefPromotionService;

    @GetMapping("/promotion/{promotionId}")
    @PreAuthorize("hasAnyRole('CHEF_PROMOTION', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> getPromotion(@PathVariable Long promotionId) {
        return ResponseEntity.ok(chefPromotionService.getPromotion(promotionId));
    }

    @GetMapping("/promotion/{promotionId}/effectifs")
    @PreAuthorize("hasAnyRole('CHEF_PROMOTION', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> getEffectifs(@PathVariable Long promotionId) {
        return ResponseEntity.ok(chefPromotionService.getEffectifs(promotionId));
    }

    @GetMapping("/promotion/{promotionId}/resultats")
    @PreAuthorize("hasAnyRole('CHEF_PROMOTION', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> getResultats(@PathVariable Long promotionId,
                                          @RequestParam String annee) {
        return ResponseEntity.ok(chefPromotionService.getResultatsPromotion(promotionId, annee));
    }

    @GetMapping("/promotion/{promotionId}/presences")
    @PreAuthorize("hasAnyRole('CHEF_PROMOTION', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> getPresences(@PathVariable Long promotionId) {
        return ResponseEntity.ok(chefPromotionService.getPresencesPromotion(promotionId));
    }

    @GetMapping("/promotion/{promotionId}/classement")
    @PreAuthorize("hasAnyRole('CHEF_PROMOTION', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> getClassement(@PathVariable Long promotionId,
                                           @RequestParam String annee) {
        return ResponseEntity.ok(chefPromotionService.getClassementPromotion(promotionId, annee));
    }
}