package cd.genuc.controller;

import cd.genuc.model.ProjetRecherche;
import cd.genuc.service.RechercheService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recherche/projets")
@RequiredArgsConstructor
public class ProjetRechercheController {

    private final RechercheService rechercheService;

    @GetMapping("/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'CHEF_DEPARTEMENT', 'DOYEN', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<ProjetRecherche>> getProjets(@PathVariable Long professeurId) {
        return ResponseEntity.ok(rechercheService.getProjets(professeurId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerProjet(@RequestBody Map<String, Object> body) {
        try {
            ProjetRecherche projet = rechercheService.creerProjet(body);
            return ResponseEntity.ok(projet);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> supprimerProjet(@PathVariable Long id, @RequestParam Long professeurId) {
        try {
            rechercheService.supprimerProjet(id, professeurId);
            return ResponseEntity.ok(Map.of("message", "Projet de recherche supprimé"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
