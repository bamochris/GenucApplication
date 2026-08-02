package cd.genuc.controller;

import cd.genuc.dto.EquivalenceDiplomeDTO;
import cd.genuc.model.EquivalenceDiplome;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.EquivalenceDiplomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Demandes de reconnaissance d'équivalence de diplôme — soumises par l'étudiant
 * (diplôme obtenu dans un autre établissement RDC ou à l'étranger), examinées et
 * décidées par la commission académique de l'université.
 */
@RestController
@RequestMapping("/api/equivalences")
@RequiredArgsConstructor
public class EquivalenceDiplomeController {

    private final EquivalenceDiplomeService equivalenceService;

    // ─────────────────────────────────────────────
    // ÉTUDIANT
    // ─────────────────────────────────────────────

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> soumettre(
            @RequestParam Long userId,
            @RequestParam Long universiteId,
            @RequestParam String etablissementOrigine,
            @RequestParam String paysOrigine,
            @RequestParam String diplomeObtenu,
            @RequestParam(required = false) String domaineEtude,
            @RequestParam(required = false) Integer anneeObtention,
            @RequestParam(required = false) String niveauObtenu,
            @RequestParam(required = false) Long filiereDemandeeId,
            @RequestParam(required = false) String niveauDemande,
            @RequestParam MultipartFile diplome,
            @RequestParam(required = false) MultipartFile releveNotes) {
        try {
            EquivalenceDiplome demande = EquivalenceDiplome.builder()
                    .etablissementOrigine(etablissementOrigine)
                    .paysOrigine(paysOrigine)
                    .diplomeObtenu(diplomeObtenu)
                    .domaineEtude(domaineEtude)
                    .anneeObtention(anneeObtention)
                    .niveauObtenu(niveauObtenu)
                    .niveauDemande(niveauDemande)
                    .build();

            EquivalenceDiplomeDTO result = equivalenceService.soumettre(
                    userId, universiteId, demande, filiereDemandeeId, diplome, releveNotes);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/etudiant/{userId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> listerParEtudiant(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(equivalenceService.listerParEtudiant(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> annuler(@PathVariable Long id, @RequestParam Long userId) {
        try {
            equivalenceService.annuler(id, userId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // COMMUN
    // ─────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(equivalenceService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // COMMISSION ACADÉMIQUE (ADMIN)
    // ─────────────────────────────────────────────

    @GetMapping("/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> listerPourCommission(@PathVariable Long universiteId,
                                                   @RequestParam(required = false) String statut) {
        try {
            return ResponseEntity.ok(equivalenceService.listerPourCommission(universiteId, statut));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/traiter")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> traiter(@PathVariable Long id,
                                      @RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal Utilisateur utilisateur) {
        try {
            String statut = String.valueOf(body.get("statut"));
            String decisionMotif = body.get("decisionMotif") != null ? body.get("decisionMotif").toString() : null;
            String niveauAccorde = body.get("niveauAccorde") != null ? body.get("niveauAccorde").toString() : null;
            Long traiteParId = utilisateur != null ? utilisateur.getId() : null;
            EquivalenceDiplomeDTO result = equivalenceService.traiter(id, statut, decisionMotif, niveauAccorde, traiteParId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
