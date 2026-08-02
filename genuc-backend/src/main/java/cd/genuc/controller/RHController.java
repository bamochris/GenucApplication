package cd.genuc.controller;

import cd.genuc.model.*;
import cd.genuc.service.RHService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rh")
@RequiredArgsConstructor
public class RHController {

    private final RHService rhService;

    // ════════════════════════════════════════════
    // PERSONNEL
    // ════════════════════════════════════════════

    @GetMapping("/personnel/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Personnel>> getPersonnel(@PathVariable Long universiteId) {
        return ResponseEntity.ok(rhService.getPersonnelParUniversite(universiteId));
    }

    @GetMapping("/personnel/departement/{departementId}")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Personnel>> getPersonnelByDept(@PathVariable Long departementId) {
        return ResponseEntity.ok(rhService.getPersonnelParDepartement(departementId));
    }

    @GetMapping("/personnel/{id}")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<Personnel> getPersonnelById(@PathVariable Long id) {
        return ResponseEntity.ok(rhService.getPersonnel(id));
    }

    /**
     * Embauche un agent.
     *
     * <p>Le rattachement arrive en paramètres de requête et non dans le corps :
     * {@code Personnel.universite} et {@code Personnel.departement} sont
     * {@code @JsonIgnore}, donc invisibles à la désérialisation, alors que
     * {@code universite_id} est {@code NOT NULL}. À défaut de paramètre, on
     * retient l'établissement de l'agent connecté.
     */
    @PostMapping("/personnel")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerPersonnel(@RequestBody Personnel personnel,
                                            @RequestParam(required = false) Long universiteId,
                                            @RequestParam(required = false) Long departementId,
                                            @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            Long cible = (universiteId != null) ? universiteId
                    : (currentUser != null ? currentUser.getUniversiteId() : null);
            return ResponseEntity.ok(rhService.creerPersonnel(personnel, cible, departementId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/personnel/{id}")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> modifierPersonnel(@PathVariable Long id, @RequestBody Personnel personnel) {
        try {
            return ResponseEntity.ok(rhService.modifierPersonnel(id, personnel));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/personnel/{id}/statut")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> changerStatut(@PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        try {
            if (!body.containsKey("statut")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "statut est requis"));
            }
            Personnel.StatutPersonnel statut = Personnel.StatutPersonnel.valueOf(body.get("statut"));
            rhService.changerStatut(id, statut);
            return ResponseEntity.ok(Map.of("message", "Statut mis à jour"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // CONTRATS
    // ════════════════════════════════════════════

    @GetMapping("/contrats/personnel/{personnelId}")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Contrat>> getContrats(@PathVariable Long personnelId) {
        return ResponseEntity.ok(rhService.getContratsParPersonnel(personnelId));
    }

    /**
     * Crée un contrat pour un agent.
     *
     * <p>L'agent est désigné en paramètre de requête : {@code Contrat.personnel}
     * est {@code @JsonIgnore}, donc toujours nul à la désérialisation.
     */
    @PostMapping("/contrats")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerContrat(@RequestBody Contrat contrat,
                                          @RequestParam Long personnelId) {
        try {
            return ResponseEntity.ok(rhService.creerContrat(contrat, personnelId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/contrats/{id}/resilier")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> resilierContrat(@PathVariable Long id) {
        try {
            rhService.resilierContrat(id);
            return ResponseEntity.ok(Map.of("message", "Contrat résilié"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // PRÉSENCES
    // ════════════════════════════════════════════

    @GetMapping("/presences/personnel/{personnelId}")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getPresences(@PathVariable Long personnelId,
                                          @RequestParam(required = false) String debut,
                                          @RequestParam(required = false) String fin) {
        LocalDate d = (debut != null) ? LocalDate.parse(debut) : LocalDate.now().minusDays(30);
        LocalDate f = (fin != null) ? LocalDate.parse(fin) : LocalDate.now();
        return ResponseEntity.ok(rhService.getPresencesParPersonnel(personnelId, d, f));
    }

    @PostMapping("/presences/{personnelId}/pointer")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> pointerArrivee(@PathVariable Long personnelId) {
        try {
            PresencePersonnel presence = PresencePersonnel.builder()
                    .personnel(rhService.getPersonnel(personnelId))
                    .build();
            return ResponseEntity.ok(rhService.enregistrerPresence(personnelId, presence));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/presences/{id}/depart")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> pointerDepart(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(rhService.enregistrerDepart(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/presences/{id}/justifier")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> justifierAbsence(@PathVariable Long id,
                                              @RequestBody Map<String, String> body) {
        try {
            String motif = body.containsKey("motif") ? body.get("motif") : "Non spécifié";
            return ResponseEntity.ok(rhService.justifierAbsence(id, motif));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════
    // PAIE – WORKFLOW COMPLET
    // ════════════════════════════════════════════

    @GetMapping("/paie/personnel/{personnelId}")
    @PreAuthorize("hasAnyRole('RH', 'COMPTABLE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Paie>> getPaies(@PathVariable Long personnelId) {
        return ResponseEntity.ok(rhService.getPaiesParPersonnel(personnelId));
    }

    @PostMapping("/paie/generer")
    @PreAuthorize("hasRole('RH')")
    public ResponseEntity<?> genererBulletin(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("personnelId") || !body.containsKey("mois") || !body.containsKey("annee")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "personnelId, mois et annee sont requis"));
            }
            Long personnelId = Long.valueOf(body.get("personnelId").toString());
            String mois = (String) body.get("mois");
            Integer annee = Integer.valueOf(body.get("annee").toString());
            Paie paie = rhService.genererBulletinPaie(personnelId, mois, annee);
            return ResponseEntity.ok(Map.of(
                    "message", "Bulletin généré avec succès",
                    "id", paie.getId(),
                    "numero", paie.getNumeroBulletin(),
                    "statut", paie.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/paie/{id}/valider")
    @PreAuthorize("hasRole('COMPTABLE')")
    public ResponseEntity<?> validerBulletin(@PathVariable Long id,
                                             @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("comptableId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "comptableId est requis"));
            }
            Long comptableId = Long.valueOf(body.get("comptableId").toString());
            String commentaire = body.containsKey("commentaire") ? (String) body.get("commentaire") : null;
            Paie paie = rhService.validerBulletinPaie(id, comptableId, commentaire);
            return ResponseEntity.ok(Map.of(
                    "message", "Bulletin validé par la comptabilité",
                    "id", paie.getId(),
                    "statut", paie.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/paie/{id}/rejeter")
    @PreAuthorize("hasRole('COMPTABLE')")
    public ResponseEntity<?> rejeterBulletin(@PathVariable Long id,
                                             @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("comptableId") || !body.containsKey("motif")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "comptableId et motif sont requis"));
            }
            Long comptableId = Long.valueOf(body.get("comptableId").toString());
            String motif = (String) body.get("motif");
            Paie paie = rhService.rejeterBulletinPaie(id, comptableId, motif);
            return ResponseEntity.ok(Map.of(
                    "message", "Bulletin rejeté",
                    "id", paie.getId(),
                    "statut", paie.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/paie/{id}/payer")
    @PreAuthorize("hasRole('RH')")
    public ResponseEntity<?> marquerPayee(@PathVariable Long id) {
        try {
            Paie paie = rhService.marquerPaiePayee(id);
            return ResponseEntity.ok(Map.of(
                    "message", "Bulletin marqué comme payé",
                    "id", paie.getId(),
                    "statut", paie.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/paie/en-attente-validation")
    @PreAuthorize("hasAnyRole('RH', 'COMPTABLE')")
    public ResponseEntity<?> getBulletinsEnAttente(@RequestParam(required = false) Long universiteId) {
        return ResponseEntity.ok(rhService.getBulletinsEnAttenteValidation(universiteId));
    }

    @GetMapping("/paie/{id}/pdf")
    @PreAuthorize("hasAnyRole('RH', 'COMPTABLE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> telechargerBulletinPdf(@PathVariable Long id) {
        try {
            byte[] pdf = rhService.genererBulletinPdf(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bulletin_" + id + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ════════════════════════════════════════════
    // STATISTIQUES
    // ════════════════════════════════════════════

    @GetMapping("/stats/{universiteId}")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getStats(@PathVariable Long universiteId) {
        return ResponseEntity.ok(rhService.getStatistiquesRH(universiteId));
    }
}