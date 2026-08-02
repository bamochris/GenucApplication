package cd.genuc.controller;

import cd.genuc.service.IAService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
public class IAController {

    private final IAService iaService;

    /** Lance l'analyse IA de risque pour une promotion */
    @PostMapping("/analyse-risque/{promotionId}/{annee}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','PROFESSEUR','CHEF_DEPARTEMENT','DOYEN')")
    public ResponseEntity<?> analyserRisque(
            @PathVariable Long promotionId,
            @PathVariable String annee) {
        return ResponseEntity.ok(iaService.analyserRisquePromotion(promotionId, annee));
    }

    /** Retourne les étudiants identifiés à risque */
    @GetMapping("/etudiants-risque")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','PROFESSEUR','CHEF_DEPARTEMENT','DOYEN')")
    public ResponseEntity<?> etudiantsARisque(
            @RequestParam(required = false) Long promotionId,
            @RequestParam(required = false) String annee,
            @RequestParam(defaultValue = "50") int seuilMax) {
        return ResponseEntity.ok(iaService.getEtudiantsARisque(promotionId, annee, seuilMax));
    }

    /** Recommandations personnalisées pour un étudiant */
    @GetMapping("/recommandations/{etudiantId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','PROFESSEUR','ETUDIANT')")
    public ResponseEntity<?> recommandations(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(Map.of("recommandations", iaService.getRecommandations(etudiantId)));
    }
}
