package cd.genuc.controller;

import cd.genuc.service.TransitionAnneeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/transition")
@RequiredArgsConstructor
public class TransitionController {

    private final TransitionAnneeService transitionService;

    @PostMapping("/passage-classe")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> passerClasse(@RequestBody Map<String, Object> body) {
        try {
            // Vérification des champs requis
            if (!body.containsKey("anneeActuelle") || !body.containsKey("anneeSuivante")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "anneeActuelle et anneeSuivante sont requis"));
            }

            Long universiteId = body.containsKey("universiteId") 
                    ? Long.valueOf(body.get("universiteId").toString()) 
                    : null;
            String anneeActuelle = (String) body.get("anneeActuelle");
            String anneeSuivante = (String) body.get("anneeSuivante");
            double coeff = body.containsKey("coefficientIndexation") 
                    ? Double.parseDouble(body.get("coefficientIndexation").toString()) 
                    : 1.0;

            Map<String, Object> result = transitionService.executerPassageClasse(universiteId, anneeActuelle, anneeSuivante, coeff);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}