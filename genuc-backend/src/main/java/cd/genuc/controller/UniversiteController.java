package cd.genuc.controller;

import cd.genuc.dto.EnregistrementUniversiteRequest;
import cd.genuc.model.Departement;
import cd.genuc.model.Faculte;
import cd.genuc.model.RoleEnum;  // ✅ Correction : import de RoleEnum
import cd.genuc.model.Universite;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.FaculteRepository;
import cd.genuc.service.UniversiteService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class UniversiteController {

    private final UniversiteService universiteService;
    private final ObjectMapper objectMapper;
    private final FaculteRepository faculteRepository;

    // ══════════════════════════════════════════
    // ROUTES PUBLIQUES (sans authentification)
    // ══════════════════════════════════════════

    @GetMapping("/api/universites/public")
    public ResponseEntity<List<Universite>> listerPublic() {
        return ResponseEntity.ok(universiteService.listerToutes());
    }

    @GetMapping("/api/universites/public/ouvertes")
    public ResponseEntity<List<Universite>> listerOuvertes() {
        return ResponseEntity.ok(universiteService.listerInscriptionsOuvertes());
    }

    @GetMapping("/api/universites/public/{id}")
    public ResponseEntity<?> obtenirPublic(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(universiteService.obtenir(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/api/universites/public/{id}/departements")
    public ResponseEntity<List<Departement>> departementsPublic(@PathVariable Long id) {
        return ResponseEntity.ok(universiteService.listerDepartements(id));
    }

    @GetMapping("/api/universites/public/{id}/facultes")
    public ResponseEntity<List<Faculte>> facultesPublic(@PathVariable Long id) {
        return ResponseEntity.ok(faculteRepository.findByUniversiteId(id));
    }

    // ══════════════════════════════════════════
    // ROUTES ADMIN (filtrées par université)
    // ══════════════════════════════════════════

    // Liste générale : le frontend (config API, sélecteurs d'université…)
    // appelle GET /api/universites — ce mapping manquait et provoquait un 500
    // (méthode non supportée convertie en UNEXPECTED_ERROR).
    @GetMapping("/api/universites")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listerUniversites() {
        return ResponseEntity.ok(universiteService.listerToutes());
    }

    @GetMapping("/api/universites/admin")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getAdminUniversite(@AuthenticationPrincipal Utilisateur currentUser) {
        // ✅ Correction : Role → RoleEnum
        if (currentUser.getRole() == RoleEnum.SUPER_ADMIN) {
            return ResponseEntity.ok(universiteService.listerToutes());
        } else if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
            // Un admin dont l'université a été supprimée (ou jamais rattachée)
            // doit recevoir un 404 explicite, pas une erreur interne 500.
            if (currentUser.getUniversiteId() == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("erreur", "Votre compte n'est rattaché à aucune université."));
            }
            try {
                // Avec l'effectif : cet écran affiche les mêmes compteurs que
                // la liste du super-admin, il ne doit pas en être privé.
                Universite uni = universiteService.obtenirAvecEffectif(currentUser.getUniversiteId());
                return ResponseEntity.ok(List.of(uni));
            } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("erreur", "L'université rattachée à votre compte n'existe plus."));
            }
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping("/api/universites")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> creer(@RequestBody Map<String, Object> body) {
        try {
            Universite uni = universiteService.creer(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(uni);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/api/universites/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> modifier(@PathVariable Long id,
                                      @RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            // ✅ Correction : Role → RoleEnum
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE && !currentUser.getUniversiteId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("erreur", "Vous ne pouvez modifier que votre propre université."));
            }
            return ResponseEntity.ok(universiteService.modifier(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/api/universites/{id}/inscriptions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> toggleInscriptions(@PathVariable Long id,
                                                @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            // ✅ Correction : Role → RoleEnum
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE && !currentUser.getUniversiteId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("erreur", "Vous ne pouvez modifier que votre propre université."));
            }
            Universite uni = universiteService.toggleInscriptions(id);
            String msg = uni.isInscriptionsOuvertes()
                ? "Inscriptions ouvertes pour " + uni.getNom()
                : "Inscriptions fermées pour " + uni.getNom();
            return ResponseEntity.ok(Map.of("message", msg, "inscriptionsOuvertes", uni.isInscriptionsOuvertes()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/api/universites/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> desactiver(@PathVariable Long id) {
        try {
            universiteService.desactiver(id);
            return ResponseEntity.ok(Map.of("message", "Université désactivée"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Suppression définitive (irréversible), réservée au super admin — le
    // frontend exige une reconfirmation du mot de passe avant d'appeler
    // cette route (voir POST /api/auth/verifier-mot-de-passe).
    @DeleteMapping("/api/universites/{id}/definitivement")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> supprimerDefinitivement(@PathVariable Long id) {
        try {
            universiteService.supprimerDefinitivement(id);
            return ResponseEntity.ok(Map.of("message", "Université supprimée définitivement"));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erreur",
                    "Impossible de supprimer : cette université a encore des données rattachées " +
                    "(salles, campus, vacations…). Retirez-les d'abord."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // Remplacement du logo (fichier) — séparé de PUT /api/universites/{id}
    // qui reste en JSON pour le reste des champs.
    @PostMapping(value = "/api/universites/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> remplacerLogo(@PathVariable Long id,
                                            @RequestPart("logo") MultipartFile logo,
                                            @AuthenticationPrincipal Utilisateur currentUser) {
        if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE && !currentUser.getUniversiteId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Vous ne pouvez modifier que le logo de votre propre université."));
        }
        try {
            Universite uni = universiteService.remplacerLogo(id, logo);
            return ResponseEntity.ok(Map.of("logo", uni.getLogo()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── Statistiques ─────────────────────────────────────────────

    /**
     * Récupère les statistiques de l'université de l'utilisateur connecté.
     * Accessible aux ADMIN_UNIVERSITE et SUPER_ADMIN.
     */
    @GetMapping("/api/universites/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> mesStatistiques(@AuthenticationPrincipal Utilisateur currentUser) {
        Long universiteId = currentUser.getUniversiteId();
        if (universiteId == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", "Vous n'êtes pas rattaché à une université."));
        }
        try {
            return ResponseEntity.ok(universiteService.statistiques(universiteId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erreur", "Université non trouvée pour cet utilisateur."));
        }
    }

    /**
     * Récupère les statistiques d'une université spécifique (par ID).
     * Les ADMIN_UNIVERSITE ne peuvent voir que leur propre université.
     * Les SUPER_ADMIN peuvent voir toutes.
     */
    @GetMapping("/api/universites/{id}/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> statistiques(@PathVariable Long id,
                                          @AuthenticationPrincipal Utilisateur currentUser) {
        // ✅ Correction : Role → RoleEnum
        if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE && !currentUser.getUniversiteId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Vous ne pouvez voir que les statistiques de votre université."));
        }
        try {
            return ResponseEntity.ok(universiteService.statistiques(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erreur", "Université non trouvée avec l'ID : " + id));
        }
    }

    // ══════════════════════════════════════════
    // DÉPARTEMENTS
    // ══════════════════════════════════════════

    @PostMapping("/api/universites/{id}/departements")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> creerDepartement(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            // ✅ Correction : Role → RoleEnum
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE && !currentUser.getUniversiteId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("erreur", "Vous ne pouvez créer que dans votre université."));
            }
            Departement dept = universiteService.creerDepartement(id, body);
            return ResponseEntity.status(HttpStatus.CREATED).body(dept);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/api/departements/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<?> modifierDepartement(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            Departement dept = universiteService.obtenirDepartement(id);
            // ✅ Correction : Role → RoleEnum
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE && !currentUser.getUniversiteId().equals(dept.getUniversite().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("erreur", "Vous ne pouvez modifier que les départements de votre université."));
            }
            return ResponseEntity.ok(universiteService.modifierDepartement(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════════════════════════
    // ENREGISTREMENT COMPLET AVEC FICHIERS
    // ════════════════════════════════════════════════════════════════

    @PostMapping(value = "/api/super-admin/universites/etapes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> enregistrerUniversiteComplete(
            @RequestPart("universite") String universiteJson,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            @RequestPart(value = "agrement", required = false) MultipartFile agrement,
            @RequestPart(value = "arrete", required = false) MultipartFile arrete,
            @RequestPart(value = "statuts", required = false) MultipartFile statuts) {

        try {
            EnregistrementUniversiteRequest request = objectMapper.readValue(universiteJson, EnregistrementUniversiteRequest.class);
            Universite uni = universiteService.enregistrerUniversiteComplete(request, logo, agrement, arrete, statuts);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Université enregistrée avec succès", "id", uni.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("erreur", "Erreur lors de l'enregistrement : " + e.getMessage()));
        }
    }
}