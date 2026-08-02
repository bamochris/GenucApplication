package cd.genuc.controller;

import cd.genuc.model.Laboratoire;
import cd.genuc.service.RechercheService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recherche/laboratoires")
@RequiredArgsConstructor
public class LaboratoireController {

    private final RechercheService rechercheService;

    @GetMapping("/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'CHEF_DEPARTEMENT', 'DOYEN', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Laboratoire>> getLaboratoires(@PathVariable Long professeurId) {
        return ResponseEntity.ok(rechercheService.getLaboratoires(professeurId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerLaboratoire(@RequestBody Map<String, Object> body) {
        try {
            Laboratoire laboratoire = rechercheService.creerLaboratoire(body);
            return ResponseEntity.ok(laboratoire);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> supprimerLaboratoire(@PathVariable Long id, @RequestParam Long professeurId) {
        try {
            rechercheService.supprimerLaboratoire(id, professeurId);
            return ResponseEntity.ok(Map.of("message", "Laboratoire supprimé"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
