package cd.genuc.controller;

import cd.genuc.model.Depense;
import cd.genuc.service.TresorerieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tresorerie")
@RequiredArgsConstructor
public class TresorerieController {

    private final TresorerieService tresorerieService;

    @PostMapping("/depenses")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE')")
    public ResponseEntity<?> ajouterDepense(@RequestBody Depense depense) {
        try {
            return ResponseEntity.ok(tresorerieService.enregistrerDepense(depense));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/jour/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<?> situationJournaliere(@PathVariable Long universiteId) {
        try {
            return ResponseEntity.ok(tresorerieService.getSituationJournaliere(universiteId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
