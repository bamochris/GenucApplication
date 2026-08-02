// src/main/java/cd/genuc/controller/FraisAdminController.java
package cd.genuc.controller;

import cd.genuc.model.*;
import cd.genuc.service.FraisAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/frais")
@RequiredArgsConstructor
public class FraisAdminController {

    private final FraisAdminService fraisAdminService;

    // ─── CATÉGORIES ──────────────────────────────────────────────

    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<List<CategorieFrais>> getCategories(@AuthenticationPrincipal Utilisateur user) {
        return ResponseEntity.ok(fraisAdminService.getCategories(user.getUniversiteId()));
    }

    @GetMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<CategorieFrais> getCategorie(@PathVariable Long id) {
        return ResponseEntity.ok(fraisAdminService.getCategorie(id));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerCategorie(@RequestBody CategorieFrais categorie,
                                            @AuthenticationPrincipal Utilisateur user) {
        try {
            if (categorie.getUniversite() == null) {
                categorie.setUniversite(new Universite());
            }
            categorie.getUniversite().setId(user.getUniversiteId());
            CategorieFrais saved = fraisAdminService.creerCategorie(categorie);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Catégorie créée avec succès",
                    "id", saved.getId(),
                    "code", saved.getCode()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<?> modifierCategorie(@PathVariable Long id,
                                               @RequestBody CategorieFrais categorie) {
        try {
            CategorieFrais updated = fraisAdminService.modifierCategorie(id, categorie);
            return ResponseEntity.ok(Map.of(
                    "message", "Catégorie modifiée avec succès",
                    "id", updated.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/categories/{id}/desactiver")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<?> desactiverCategorie(@PathVariable Long id) {
        try {
            fraisAdminService.desactiverCategorie(id);
            return ResponseEntity.ok(Map.of("message", "Catégorie désactivée"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── FRAIS ──────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Frais>> getFrais(@AuthenticationPrincipal Utilisateur user,
                                                @RequestParam(required = false) String annee) {
        return ResponseEntity.ok(fraisAdminService.getFrais(user.getUniversiteId(), annee));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<Frais> getFrais(@PathVariable Long id) {
        return ResponseEntity.ok(fraisAdminService.getFrais(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerFrais(@RequestBody Frais frais,
                                        @AuthenticationPrincipal Utilisateur user) {
        try {
            if (frais.getUniversite() == null) {
                frais.setUniversite(new Universite());
            }
            frais.getUniversite().setId(user.getUniversiteId());
            Frais saved = fraisAdminService.creerFrais(frais);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Frais créé et affecté avec succès",
                    "id", saved.getId(),
                    "code", saved.getCode(),
                    "promotionId", saved.getPromotionId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<?> modifierFrais(@PathVariable Long id,
                                           @RequestBody Frais frais) {
        try {
            Frais updated = fraisAdminService.modifierFrais(id, frais);
            return ResponseEntity.ok(Map.of(
                    "message", "Frais modifié avec succès",
                    "id", updated.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/desactiver")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<?> desactiverFrais(@PathVariable Long id) {
        try {
            fraisAdminService.desactiverFrais(id);
            return ResponseEntity.ok(Map.of("message", "Frais désactivé et affectations annulées"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/archiver")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<?> archiverFrais(@PathVariable Long id) {
        try {
            fraisAdminService.archiverFrais(id);
            return ResponseEntity.ok(Map.of("message", "Frais archivé"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/reaffecter")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<?> reaffecterFrais(@PathVariable Long id) {
        try {
            fraisAdminService.reaffecterFrais(id);
            return ResponseEntity.ok(Map.of("message", "Réaffectation effectuée avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── AFFECTATION INDIVIDUELLE ──────────────────────────────

    @PostMapping("/{fraisId}/affecter/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<?> affecterIndividuel(@PathVariable Long fraisId,
                                                @PathVariable Long inscriptionId) {
        try {
            AffectationFrais af = fraisAdminService.affecterFraisIndividuel(fraisId, inscriptionId);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Frais affecté à l'étudiant avec succès",
                    "id", af.getId(),
                    "inscriptionId", af.getInscription().getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── HISTORIQUE ET STATISTIQUES ─────────────────────────────

    @GetMapping("/historique")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getHistorique(@AuthenticationPrincipal Utilisateur user,
                                           @RequestParam(required = false) Long inscriptionId) {
        return ResponseEntity.ok(fraisAdminService.getHistoriqueAffectations(user.getUniversiteId(), inscriptionId));
    }

    @GetMapping("/statistiques")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'COMPTABLE', 'CAISSIER', 'RECTEUR', 'SUPER_ADMIN')")
    public ResponseEntity<?> getStatistiques(@AuthenticationPrincipal Utilisateur user,
                                             @RequestParam(required = false) String annee) {
        if (annee == null || annee.isEmpty()) {
            int year = java.time.LocalDate.now().getYear();
            annee = year + "-" + (year + 1);
        }
        return ResponseEntity.ok(fraisAdminService.getStatistiquesFrais(user.getUniversiteId(), annee));
    }
}