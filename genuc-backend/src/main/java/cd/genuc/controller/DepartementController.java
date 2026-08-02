package cd.genuc.controller;

import cd.genuc.model.Departement;
import cd.genuc.model.Filiere;
import cd.genuc.model.RoleEnum;  // ✅ Correction
import cd.genuc.model.Utilisateur;
import cd.genuc.service.DepartementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departements")
@RequiredArgsConstructor
public class DepartementController {

    private final DepartementService departementService;

    // ═══ Routes publiques ═══
    @GetMapping("/public/{id}")
    public ResponseEntity<?> getDepartementPublic(@PathVariable Long id) {
        try {
            Departement dept = departementService.obtenir(id);
            return ResponseEntity.ok(dept);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/public/{id}/filieres")
    public ResponseEntity<?> getFilieresPublic(@PathVariable Long id) {
        try {
            List<Filiere> filieres = departementService.listerFilieres(id);
            return ResponseEntity.ok(filieres);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/public/actifs")
    public ResponseEntity<?> getAllDepartementsActifs() {
        return ResponseEntity.ok(departementService.listerTousActifs());
    }

    // ═══ Routes admin ═══
    @PostMapping("/{id}/filieres")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<?> creerFiliere(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            // ✅ Correction
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
                Departement dept = departementService.obtenir(id);
                if (!currentUser.getUniversiteId().equals(dept.getUniversite().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("erreur", "Vous ne pouvez créer que dans votre université."));
                }
            }
            Filiere filiere = departementService.creerFiliere(id, body);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Filière créée avec succès",
                "id", filiere.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/filieres/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<?> modifierFiliere(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
                Filiere filiere = departementService.obtenirFiliere(id);
                Long universiteId = filiere.getDepartement().getUniversite().getId();
                if (!currentUser.getUniversiteId().equals(universiteId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("erreur", "Vous ne pouvez modifier que les filières de votre université."));
                }
            }
            Filiere filiere = departementService.modifierFiliere(id, body);
            return ResponseEntity.ok(Map.of("message", "Filière modifiée avec succès", "id", filiere.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/filieres/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> desactiverFiliere(
            @PathVariable Long id,
            @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
                Filiere filiere = departementService.obtenirFiliere(id);
                Long universiteId = filiere.getDepartement().getUniversite().getId();
                if (!currentUser.getUniversiteId().equals(universiteId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("erreur", "Vous ne pouvez modifier que les filières de votre université."));
                }
            }
            departementService.desactiverFiliere(id);
            return ResponseEntity.ok(Map.of("message", "Filière désactivée avec succès", "id", id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<?> getStats(
            @PathVariable Long id,
            @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
                Departement dept = departementService.obtenir(id);
                if (!currentUser.getUniversiteId().equals(dept.getUniversite().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("erreur", "Vous ne pouvez voir que les statistiques de votre université."));
                }
            }
            return ResponseEntity.ok(departementService.statistiques(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        }
    }
}