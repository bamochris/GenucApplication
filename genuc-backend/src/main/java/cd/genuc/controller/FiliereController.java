package cd.genuc.controller;

import cd.genuc.model.Filiere;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.FiliereService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/filieres")
@RequiredArgsConstructor
public class FiliereController {

    private final FiliereService filiereService;

    // ═══════════════════════════════════════════════════════════
    // 1. ENDPOINTS PUBLICS
    // ═══════════════════════════════════════════════════════════

    @GetMapping("/public/disponibles")
    public ResponseEntity<?> getFilieresDisponibles(
            @RequestParam Long universiteId,
            @RequestParam(required = false) String anneeAcademique) {
        try {
            List<Filiere> filieres = filiereService.getFilieresDisponibles(universiteId, anneeAcademique);
            return ResponseEntity.ok(filieres);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<?> getFilierePublic(@PathVariable Long id) {
        try {
            Filiere filiere = filiereService.getFiliere(id);
            return ResponseEntity.ok(filiere);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 2. ENDPOINTS ADMIN (avec vérification d'appartenance)
    // ═══════════════════════════════════════════════════════════

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> creerFiliere(@RequestBody Filiere filiere,
                                          @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
                if (filiere.getDepartement() == null || filiere.getDepartement().getUniversite() == null 
                        || filiere.getDepartement().getUniversite().getId() == null) {
                    return ResponseEntity.badRequest().body(Map.of("erreur", "Département ou université non spécifié"));
                }
                Long universiteId = filiere.getDepartement().getUniversite().getId();
                if (!currentUser.getUniversiteId().equals(universiteId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("erreur", "Vous ne pouvez créer que des filières dans votre université."));
                }
            }
            Filiere saved = filiereService.creerFiliere(filiere);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> modifierFiliere(@PathVariable Long id,
                                             @RequestBody Filiere filiere,
                                             @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
                Filiere existing = filiereService.getFiliere(id);
                Long universiteId = existing.getDepartement().getUniversite().getId();
                if (!currentUser.getUniversiteId().equals(universiteId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("erreur", "Vous ne pouvez modifier que les filières de votre université."));
                }
            }
            Filiere updated = filiereService.modifierFiliere(id, filiere);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/activer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> toggleActif(@PathVariable Long id,
                                         @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
                Filiere existing = filiereService.getFiliere(id);
                Long universiteId = existing.getDepartement().getUniversite().getId();
                if (!currentUser.getUniversiteId().equals(universiteId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("erreur", "Vous ne pouvez modifier que les filières de votre université."));
                }
            }
            Filiere filiere = filiereService.toggleActif(id);
            return ResponseEntity.ok(Map.of(
                    "message", "Statut actif mis à jour",
                    "actif", filiere.isActif()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle-inscriptions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> toggleInscriptions(@PathVariable Long id,
                                                @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
                Filiere existing = filiereService.getFiliere(id);
                Long universiteId = existing.getDepartement().getUniversite().getId();
                if (!currentUser.getUniversiteId().equals(universiteId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("erreur", "Vous ne pouvez modifier que les filières de votre université."));
                }
            }
            Filiere filiere = filiereService.toggleInscriptions(id);
            return ResponseEntity.ok(Map.of(
                    "message", "Statut inscriptions mis à jour",
                    "inscriptionsOuvertes", filiere.isInscriptionsOuvertes()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // Bascule l'exigence du test d'admission pour une filière. Ouvert au
    // secrétaire académique (en plus de l'admin) : c'est le geste « au besoin »
    // sans lui donner l'édition complète des filières (moindre privilège).
    @PatchMapping("/{id}/toggle-test-admission")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> toggleTestAdmission(@PathVariable Long id,
                                                 @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            if (currentUser.getRole() != RoleEnum.SUPER_ADMIN) {
                Filiere existing = filiereService.getFiliere(id);
                Long universiteId = existing.getDepartement().getUniversite().getId();
                if (!currentUser.getUniversiteId().equals(universiteId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("erreur", "Vous ne pouvez modifier que les filières de votre université."));
                }
            }
            Filiere filiere = filiereService.toggleTestAdmission(id);
            return ResponseEntity.ok(Map.of(
                    "message", "Exigence du test d'admission mise à jour",
                    "testAdmissionRequis", filiere.isTestAdmissionRequis()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // Liste des filières d'une université (actives ou non) pour le panneau de
    // gestion de l'exigence du test (secrétaire / admin).
    @GetMapping("/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> getFilieresParUniversite(@PathVariable Long universiteId,
                                                      @AuthenticationPrincipal Utilisateur currentUser) {
        if (currentUser.getRole() != RoleEnum.SUPER_ADMIN
                && !universiteId.equals(currentUser.getUniversiteId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Accès limité à votre université."));
        }
        return ResponseEntity.ok(filiereService.getFilieresParUniversite(universiteId));
    }

    @GetMapping("/departement/{departementId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<List<Filiere>> getFilieresParDepartement(@PathVariable Long departementId,
                                                                   @AuthenticationPrincipal Utilisateur currentUser) {
        return ResponseEntity.ok(filiereService.getFilieresParDepartement(departementId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<Filiere> getFiliere(@PathVariable Long id) {
        return ResponseEntity.ok(filiereService.getFiliere(id));
    }
}