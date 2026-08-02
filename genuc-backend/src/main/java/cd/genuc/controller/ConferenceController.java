package cd.genuc.controller;

import cd.genuc.model.Conference;
import cd.genuc.service.RechercheService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recherche/conferences")
@RequiredArgsConstructor
public class ConferenceController {

    private final RechercheService rechercheService;

    @GetMapping("/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'CHEF_DEPARTEMENT', 'DOYEN', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Conference>> getConferences(@PathVariable Long professeurId) {
        return ResponseEntity.ok(rechercheService.getConferences(professeurId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerConference(@RequestBody Map<String, Object> body) {
        try {
            Conference conference = rechercheService.creerConference(body);
            return ResponseEntity.ok(conference);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> supprimerConference(@PathVariable Long id, @RequestParam Long professeurId) {
        try {
            rechercheService.supprimerConference(id, professeurId);
            return ResponseEntity.ok(Map.of("message", "Conférence supprimée"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
