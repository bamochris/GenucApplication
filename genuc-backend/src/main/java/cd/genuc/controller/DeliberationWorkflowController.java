package cd.genuc.controller;

import cd.genuc.model.Deliberation;
import cd.genuc.model.ParametresLMD;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.DeliberationService;
import cd.genuc.service.DeliberationWorkflowService;
import cd.genuc.service.PdfDeliberationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deliberation")
@RequiredArgsConstructor
public class DeliberationWorkflowController {

    private final DeliberationWorkflowService workflow;
    private final PdfDeliberationService pdfService;
    private final DeliberationService deliberationService;

    // ─────────────────────────────────────────────
    // ADMIN
    // ─────────────────────────────────────────────

    @PostMapping("/premiere")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> premiereDelib(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("promotionId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "promotionId est requis"));
            }
            if (!body.containsKey("anneeAcademique")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "anneeAcademique est requis"));
            }
            Long promoId = Long.valueOf(body.get("promotionId").toString());
            String annee = (String) body.get("anneeAcademique");
            return ResponseEntity.ok(workflow.premiereDeliberation(promoId, annee));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/rattrapage")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> rattrapageDelib(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("promotionId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "promotionId est requis"));
            }
            if (!body.containsKey("anneeAcademique")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "anneeAcademique est requis"));
            }
            Long promoId = Long.valueOf(body.get("promotionId").toString());
            String annee = (String) body.get("anneeAcademique");
            return ResponseEntity.ok(workflow.rattrapageDeliberation(promoId, annee));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/cloturer")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> cloturer(@RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal Utilisateur utilisateur) {
        try {
            if (!body.containsKey("anneeAcademique")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "anneeAcademique est requis"));
            }
            String annee = (String) body.get("anneeAcademique");
            // L'établissement vient du compte appelant ; un SUPER_ADMIN, qui n'en a
            // pas, doit désigner explicitement celui qu'il clôture.
            Long universiteId = body.get("universiteId") != null
                    ? Long.valueOf(body.get("universiteId").toString())
                    : (utilisateur != null ? utilisateur.getUniversiteId() : null);
            if (universiteId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("erreur", "universiteId est requis pour clôturer une année"));
            }
            return ResponseEntity.ok(workflow.cloturerAnnee(annee, universiteId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/pv-global")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> genererPvGlobal(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("promotionId")) {
                return ResponseEntity.badRequest().body(null);
            }
            if (!body.containsKey("anneeAcademique")) {
                return ResponseEntity.badRequest().body(null);
            }
            Long promoId = Long.valueOf(body.get("promotionId").toString());
            String annee = (String) body.get("anneeAcademique");
            byte[] pdf = pdfService.genererPvGlobal(promoId, annee);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=PV_Deliberation_" + annee + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF", e);
        }
    }

    // ─────────────────────────────────────────────
    // ÉTUDIANT
    // ─────────────────────────────────────────────

    @GetMapping("/etudiant/resultats")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> getMesResultats(@AuthenticationPrincipal Utilisateur etudiant,
                                             @RequestParam String anneeAcademique) {
        Long inscriptionId = etudiant.getInscriptionId();
        if (inscriptionId == null) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune inscription associée"));
        }
        try {
            return ResponseEntity.ok(workflow.getResultatsEtudiant(inscriptionId, anneeAcademique));
        } catch (RuntimeException e) {
            // Un étudiant pas encore délibéré n'est pas une panne. Le service lève
            // une exception dans ce cas, qui ressortait en 500 pour TOUT nouvel
            // inscrit consultant ses résultats — le cas le plus courant en début
            // d'année. On répond « pas encore de résultats », que l'écran sait
            // présenter comme un état vide.
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "erreur", "Aucun résultat de délibération pour l'année " + anneeAcademique,
                "code", "DELIBERATION_ABSENTE"));
        }
    }

    @GetMapping("/etudiant/pdf")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<byte[]> telechargerMonReleve(@AuthenticationPrincipal Utilisateur etudiant,
                                                       @RequestParam String anneeAcademique) {
        try {
            byte[] pdf = pdfService.genererReleveIndividuel(etudiant.getInscriptionId(), anneeAcademique);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=releve_" + anneeAcademique + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF", e);
        }
    }

    // ─────────────────────────────────────────────
    // PARAMÈTRES LMD
    // ─────────────────────────────────────────────

    @GetMapping("/parametres/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<?> getParametresLMD(@PathVariable Long universiteId) {
        return ResponseEntity.ok(deliberationService.getParametresLMD(universiteId));
    }

    @PutMapping("/parametres/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<?> updateParametresLMD(@PathVariable Long universiteId,
                                                  @RequestBody ParametresLMD params) {
        try {
            return ResponseEntity.ok(deliberationService.updateParametresLMD(universiteId, params));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // PRÉPARATION (granulaire, par inscription/département)
    // ─────────────────────────────────────────────

    @PostMapping("/preparer")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> preparer(@RequestParam Long inscriptionId, @RequestParam String annee) {
        try {
            return ResponseEntity.ok(deliberationService.preparer(inscriptionId, annee));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/preparer/departement")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<?> preparerParDepartement(@RequestParam Long departementId,
                                                     @RequestParam String annee,
                                                     @RequestParam String niveau) {
        return ResponseEntity.ok(deliberationService.preparerParDepartement(departementId, annee, niveau));
    }

    // ─────────────────────────────────────────────
    // CONSOLIDATION ASYNCHRONE
    // ─────────────────────────────────────────────

    @PostMapping("/consolider")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> lancerConsolidation(@RequestParam Long universiteId, @RequestParam String annee) {
        String jobId = deliberationService.demarrerConsolidation(universiteId, annee);
        return ResponseEntity.ok(Map.of("jobId", jobId, "status", "EN_COURS"));
    }

    @GetMapping("/consolider/status/{jobId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getConsolidationStatus(@PathVariable String jobId) {
        return ResponseEntity.ok(deliberationService.getConsolidationStatus(jobId));
    }

    // ─────────────────────────────────────────────
    // TENUE DU JURY / PUBLICATION
    // ─────────────────────────────────────────────

    @PatchMapping("/{id}/tenue")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'CHEF_DEPARTEMENT')")
    public ResponseEntity<?> tenueJury(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            return ResponseEntity.ok(deliberationService.tenuePar(id, data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{id}/publier")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> publierUne(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(deliberationService.publier(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/publier/departement")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> publierDepartement(@RequestParam Long departementId, @RequestParam String annee) {
        int count = deliberationService.publierDepartement(departementId, annee);
        return ResponseEntity.ok(Map.of("count", count));
    }

    // ─────────────────────────────────────────────
    // CONSULTATION
    // ─────────────────────────────────────────────

    @GetMapping("/inscription/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'ETUDIANT', 'SECRETAIRE_ACADEMIQUE', 'CHEF_DEPARTEMENT', 'DOYEN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> getByInscription(@PathVariable Long inscriptionId, @RequestParam String annee) {
        return deliberationService.maDeliberation(inscriptionId, annee)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/liste")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE', 'DOYEN')")
    public ResponseEntity<Page<Deliberation>> getListe(@RequestParam Long universiteId,
                                                        @RequestParam String annee,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(deliberationService.getDeliberationsPaginees(universiteId, annee, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'ETUDIANT', 'SECRETAIRE_ACADEMIQUE', 'CHEF_DEPARTEMENT', 'DOYEN')")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(deliberationService.obtenir(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // STATISTIQUES
    // ─────────────────────────────────────────────

    @GetMapping("/stats/avancees")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'RECTEUR')")
    public ResponseEntity<?> getStatsAvancees(@RequestParam Long universiteId, @RequestParam String annee) {
        return ResponseEntity.ok(deliberationService.statsUniversiteAvancees(universiteId, annee));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'RECTEUR')")
    public ResponseEntity<?> getStats(@RequestParam Long universiteId, @RequestParam String annee) {
        return ResponseEntity.ok(deliberationService.statsUniversite(universiteId, annee));
    }

    // ─────────────────────────────────────────────
    // RELEVÉ / BULLETIN
    // ─────────────────────────────────────────────

    @GetMapping("/releve/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'ETUDIANT', 'SECRETAIRE_ACADEMIQUE') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> getReleve(@PathVariable Long inscriptionId, @RequestParam String annee) {
        try {
            return ResponseEntity.ok(deliberationService.genererReleveNotes(inscriptionId, annee));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/bulletin/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'ETUDIANT', 'SECRETAIRE_ACADEMIQUE') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<byte[]> telechargerBulletin(@PathVariable Long inscriptionId,
                                                       @RequestParam String annee,
                                                       @RequestParam(defaultValue = "ANNUEL") String type) {
        try {
            byte[] pdf = pdfService.genererReleveIndividuel(inscriptionId, annee);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bulletin_" + annee + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF", e);
        }
    }

    @GetMapping("/releve/telecharger/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'ETUDIANT', 'SECRETAIRE_ACADEMIQUE') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<byte[]> telechargerReleve(@PathVariable Long inscriptionId, @RequestParam String annee) {
        try {
            byte[] pdf = pdfService.genererReleveIndividuel(inscriptionId, annee);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=releve_" + annee + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF", e);
        }
    }

    // ─────────────────────────────────────────────
    // AUDIT
    // ─────────────────────────────────────────────

    @GetMapping("/audit")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getAudit(@RequestParam(required = false) Long universiteId,
                                       @RequestParam(required = false) String action,
                                       @RequestParam(required = false) Long utilisateur,
                                       @RequestParam(required = false) String dateDebut,
                                       @RequestParam(required = false) String dateFin,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "50") int size) {
        LocalDateTime debut = dateDebut != null && !dateDebut.isBlank() ? LocalDateTime.parse(dateDebut) : null;
        LocalDateTime fin = dateFin != null && !dateFin.isBlank() ? LocalDateTime.parse(dateFin) : null;
        return ResponseEntity.ok(deliberationService.getAuditDeliberation(action, utilisateur, debut, fin, page, size));
    }

    // ─────────────────────────────────────────────
    // VÉRIFICATION DIPLÔME (public)
    // ─────────────────────────────────────────────

    @GetMapping("/verifier/{uuid}")
    public ResponseEntity<?> verifierDiplome(@PathVariable String uuid) {
        try {
            return ResponseEntity.ok(deliberationService.verifierDiplome(uuid));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("valide", false, "message", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // IMPORT NOTES EN LOT
    // ─────────────────────────────────────────────

    @PostMapping("/import/notes")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> importerNotes(@RequestBody Map<String, Object> body) {
        try {
            List<Map<String, Object>> notes = (List<Map<String, Object>>) body.get("notes");
            Long coursId = Long.valueOf(body.get("coursId").toString());
            String annee = (String) body.get("annee");
            return ResponseEntity.ok(deliberationService.importerNotesBatch(notes, coursId, annee));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
