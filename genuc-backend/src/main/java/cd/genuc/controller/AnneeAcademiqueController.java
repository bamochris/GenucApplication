package cd.genuc.controller;

import cd.genuc.model.AnneeAcademique;
import cd.genuc.repository.AnneeAcademiqueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/annees-academiques")
@RequiredArgsConstructor
public class AnneeAcademiqueController {

    private final AnneeAcademiqueRepository anneeRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> lister() {
        return ResponseEntity.ok(anneeRepository.findByActiveTrue());
    }

    // Variante publique : le formulaire d'inscription (candidat anonyme, sans
    // compte) a besoin de choisir son année académique avant même d'exister
    // en tant qu'utilisateur authentifié.
    @GetMapping("/public")
    public ResponseEntity<?> listerPublic() {
        return ResponseEntity.ok(anneeRepository.findByActiveTrue());
    }

    // Liste complète (actives + inactives) pour l'écran de gestion : sans elle
    // une année désactivée disparaîtrait de l'interface sans pouvoir être réactivée.
    @GetMapping("/toutes")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> listerToutes() {
        List<AnneeAcademique> annees = anneeRepository.findAll();
        annees.sort(Comparator.comparing(AnneeAcademique::getLibelle,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return ResponseEntity.ok(annees);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creer(@RequestBody Map<String, Object> body) {
        String libelle = body.get("libelle") != null ? body.get("libelle").toString().trim() : "";
        if (libelle.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le libellé est obligatoire (ex : 2025-2026)."));
        }
        if (anneeRepository.findByLibelle(libelle).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Cette année académique existe déjà."));
        }
        AnneeAcademique annee = new AnneeAcademique();
        annee.setLibelle(libelle);
        annee.setActive(body.get("active") == null || Boolean.parseBoolean(body.get("active").toString()));
        return ResponseEntity.status(HttpStatus.CREATED).body(anneeRepository.save(annee));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> modifier(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return anneeRepository.findById(id).<ResponseEntity<?>>map(annee -> {
            if (body.containsKey("active"))   annee.setActive(Boolean.parseBoolean(body.get("active").toString()));
            if (body.containsKey("cloturee")) annee.setCloturee(Boolean.parseBoolean(body.get("cloturee").toString()));
            if (body.containsKey("libelle") && body.get("libelle") != null && !body.get("libelle").toString().isBlank()) {
                annee.setLibelle(body.get("libelle").toString().trim());
            }
            return ResponseEntity.ok(anneeRepository.save(annee));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Année académique introuvable.")));
    }
}