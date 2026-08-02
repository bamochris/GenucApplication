package cd.genuc.controller;

import cd.genuc.service.RecteurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/recteur")
@RequiredArgsConstructor
public class RecteurController {

    private final RecteurService recteurService;

    @GetMapping("/dashboard/{universiteId}")
    @PreAuthorize("hasAnyRole('RECTEUR', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> getDashboard(@PathVariable Long universiteId) {
        try {
            return ResponseEntity.ok(recteurService.getDashboardExecutif(universiteId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/evolution/{universiteId}")
    @PreAuthorize("hasAnyRole('RECTEUR', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> getEvolution(@PathVariable Long universiteId) {
        return ResponseEntity.ok(recteurService.getEvolutionEffectifs(universiteId));
    }

    @GetMapping("/reussite/{universiteId}")
    @PreAuthorize("hasAnyRole('RECTEUR', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> getReussiteParFaculte(
            @PathVariable Long universiteId,
            @RequestParam(defaultValue = "") String annee) {
        return ResponseEntity.ok(recteurService.getReussiteParFaculte(universiteId, annee));
    }

    @PostMapping("/valider")
    @PreAuthorize("hasAnyRole('RECTEUR', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> validerDecision(@RequestBody Map<String, Object> body) {
        try {
            // Vérification des champs requis
            if (!body.containsKey("decisionId") || !body.containsKey("type") || !body.containsKey("recteurId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "decisionId, type et recteurId sont requis"));
            }
            
            Long decisionId = Long.valueOf(body.get("decisionId").toString());
            String type = (String) body.get("type");
            Long recteurId = Long.valueOf(body.get("recteurId").toString());
            String commentaire = body.containsKey("commentaire") ? (String) body.get("commentaire") : null;

            return ResponseEntity.ok(recteurService.validerDecision(decisionId, type, recteurId, commentaire));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}