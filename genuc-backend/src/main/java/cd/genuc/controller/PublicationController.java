package cd.genuc.controller;

import cd.genuc.model.Publication;
import cd.genuc.service.RechercheService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recherche/publications")
@RequiredArgsConstructor
public class PublicationController {

    private final RechercheService rechercheService;

    @GetMapping("/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'CHEF_DEPARTEMENT', 'DOYEN', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Publication>> getPublications(@PathVariable Long professeurId) {
        return ResponseEntity.ok(rechercheService.getPublications(professeurId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerPublication(@RequestBody Map<String, Object> body) {
        try {
            Publication publication = rechercheService.creerPublication(body);
            return ResponseEntity.ok(publication);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> supprimerPublication(@PathVariable Long id, @RequestParam Long professeurId) {
        try {
            rechercheService.supprimerPublication(id, professeurId);
            return ResponseEntity.ok(Map.of("message", "Publication supprimée"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
