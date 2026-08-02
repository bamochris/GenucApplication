package cd.genuc.controller;

import cd.genuc.model.*;
import cd.genuc.service.ServiceSocialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class ServiceSocialController {

    private final ServiceSocialService socialService;

    // ════════════════════════════════════════════
    // DOSSIERS SOCIAUX
    // ════════════════════════════════════════════

    @GetMapping("/dossiers/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<DossierSocial>> getDossiers(@PathVariable Long universiteId) {
        return ResponseEntity.ok(socialService.getDossiersParUniversite(universiteId));
    }

    @GetMapping("/dossiers/statut/{statut}")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<DossierSocial>> getDossiersParStatut(
            @PathVariable String statut,
            @RequestParam(required = false) Long universiteId) {
        DossierSocial.StatutDossierSocial s = DossierSocial.StatutDossierSocial.valueOf(statut);
        return ResponseEntity.ok(socialService.getDossiersParStatut(s, universiteId));
    }

    @GetMapping("/dossiers/etudiant/{etudiantId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'SERVICE_SOCIAL', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<DossierSocial> getDossierByEtudiant(@PathVariable Long etudiantId) {
        try {
            return ResponseEntity.ok(socialService.getDossierByEtudiant(etudiantId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/dossiers/{id}")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<DossierSocial> getDossier(@PathVariable Long id) {
        return ResponseEntity.ok(socialService.getDossier(id));
    }

    @PostMapping("/dossiers")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'SERVICE_SOCIAL', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> creerDossier(@RequestBody DossierSocial dossier) {
        try {
            return ResponseEntity.ok(socialService.creerDossier(dossier));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/dossiers/{id}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'SERVICE_SOCIAL', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> modifierDossier(@PathVariable Long id, @RequestBody DossierSocial dossier) {
        try {
            return ResponseEntity.ok(socialService.modifierDossier(id, dossier));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/dossiers/{id}/statut")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> changerStatutDossier(@PathVariable Long id,
                                                  @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("statut")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "statut est requis"));
            }
            DossierSocial.StatutDossierSocial statut = DossierSocial.StatutDossierSocial.valueOf((String) body.get("statut"));
            String commentaire = body.containsKey("commentaire") ? (String) body.get("commentaire") : null;
            Long adminId = body.containsKey("adminId") ? Long.valueOf(body.get("adminId").toString()) : null;
            return ResponseEntity.ok(socialService.changerStatut(id, statut, commentaire, adminId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // BOURSES
    // ════════════════════════════════════════════

    @GetMapping("/bourses/etudiant/{etudiantId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'SERVICE_SOCIAL', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<List<Bourse>> getBoursesEtudiant(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(socialService.getBoursesParEtudiant(etudiantId));
    }

    @GetMapping("/bourses/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Bourse>> getBoursesUniversite(@PathVariable Long universiteId) {
        return ResponseEntity.ok(socialService.getBoursesParUniversite(universiteId));
    }

    @GetMapping("/bourses/{id}")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<Bourse> getBourse(@PathVariable Long id) {
        return ResponseEntity.ok(socialService.getBourse(id));
    }

    @PostMapping("/bourses")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> creerBourse(@RequestBody Bourse bourse) {
        try {
            return ResponseEntity.ok(socialService.creerBourse(bourse));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/bourses/{id}/suspendre")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> suspendreBourse(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(socialService.suspendreBourse(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/bourses/{id}/terminer")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> terminerBourse(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(socialService.terminerBourse(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // AIDES SOCIALES
    // ════════════════════════════════════════════

    @GetMapping("/aides/etudiant/{etudiantId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'SERVICE_SOCIAL', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<List<AideSociale>> getAidesEtudiant(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(socialService.getAidesParEtudiant(etudiantId));
    }

    @GetMapping("/aides/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<AideSociale>> getAidesUniversite(@PathVariable Long universiteId) {
        return ResponseEntity.ok(socialService.getAidesParUniversite(universiteId));
    }

    @GetMapping("/aides/statut/{statut}")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<AideSociale>> getAidesParStatut(
            @PathVariable String statut,
            @RequestParam(required = false) Long universiteId) {
        AideSociale.StatutAide s = AideSociale.StatutAide.valueOf(statut);
        return ResponseEntity.ok(socialService.getAidesParStatut(s, universiteId));
    }

    @GetMapping("/aides/{id}")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<AideSociale> getAide(@PathVariable Long id) {
        return ResponseEntity.ok(socialService.getAide(id));
    }

    @PostMapping("/aides")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'SERVICE_SOCIAL', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> creerAide(@RequestBody AideSociale aide) {
        try {
            return ResponseEntity.ok(socialService.creerAide(aide));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/aides/{id}/traiter")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> traiterAide(@PathVariable Long id,
                                         @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("statut")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "statut est requis"));
            }
            AideSociale.StatutAide statut = AideSociale.StatutAide.valueOf((String) body.get("statut"));
            String commentaire = body.containsKey("commentaire") ? (String) body.get("commentaire") : null;
            Long traiteParId = body.containsKey("traiteParId") ? Long.valueOf(body.get("traiteParId").toString()) : null;
            return ResponseEntity.ok(socialService.traiterAide(id, statut, commentaire, traiteParId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // STATISTIQUES
    // ════════════════════════════════════════════

    @GetMapping("/stats/{universiteId}")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getStats(@PathVariable Long universiteId) {
        return ResponseEntity.ok(socialService.getStatistiques(universiteId));
    }
}