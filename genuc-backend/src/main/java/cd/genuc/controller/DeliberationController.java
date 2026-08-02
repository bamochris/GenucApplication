package cd.genuc.controller;

import cd.genuc.model.Deliberation;
import cd.genuc.service.DeliberationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API REST — Délibérations et Diplômes GENUC
 */
@RestController
@RequiredArgsConstructor
public class DeliberationController {

    private final DeliberationService deliberationService;

    // ══════════════════════════════════════════
    // VÉRIFICATION PUBLIQUE (QR code diplôme)
    // ══════════════════════════════════════════

    @GetMapping("/api/verifier/{uuid}")
    public ResponseEntity<?> verifierDiplome(@PathVariable String uuid) {
        try {
            return ResponseEntity.ok(deliberationService.verifierDiplome(uuid));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(Map.of(
                "valide",  false,
                "message", "Document introuvable dans la base GENUC"
            ));
        }
    }

    // ══════════════════════════════════════════
    // VUE ÉTUDIANT
    // ══════════════════════════════════════════

    @GetMapping("/api/deliberations/etudiant/{inscriptionId}/{annee}")
    @PreAuthorize("hasAnyRole('ETUDIANT','AGENT','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> maDeliberation(
            @PathVariable Long inscriptionId,
            @PathVariable String annee) {
        return deliberationService.maDeliberation(inscriptionId, annee)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/deliberations/releve/{inscriptionId}/{annee}")
    @PreAuthorize("hasAnyRole('ETUDIANT','AGENT','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> releveNotes(
            @PathVariable Long inscriptionId,
            @PathVariable String annee) {
        try {
            return ResponseEntity.ok(deliberationService.genererReleveNotes(inscriptionId, annee));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // PRÉPARATION (Chef département / Admin)
    // ══════════════════════════════════════════

    @PostMapping("/api/deliberations/preparer/{inscriptionId}/{annee}")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> preparer(
            @PathVariable Long inscriptionId,
            @PathVariable String annee) {
        try {
            Deliberation d = deliberationService.preparer(inscriptionId, annee);
            return ResponseEntity.ok(Map.of(
                "message",          "Délibération préparée",
                "id",               d.getId(),
                "moyenneGenerale",  d.getMoyenneGenerale(),
                "decision",         d.getDecision(),
                "mention",          d.getMention() != null ? d.getMention().name() : "—",
                "creditsValides",   d.getCreditsValides(),
                "statut",           d.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/api/deliberations/preparer-lot")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> preparerEnLot(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("departementId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "departementId est requis"));
            }
            if (!body.containsKey("anneeAcademique")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "anneeAcademique est requis"));
            }
            Long deptId = Long.valueOf(body.get("departementId").toString());
            String annee  = (String) body.get("anneeAcademique");
            String niveau = body.containsKey("niveau") ? (String) body.get("niveau") : null;
            return ResponseEntity.ok(
                deliberationService.preparerParDepartement(deptId, annee, niveau)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // JURY
    // ══════════════════════════════════════════

    @PutMapping("/api/deliberations/{id}/jury")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> decisionJury(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            Deliberation d = deliberationService.tenuePar(id, body);
            return ResponseEntity.ok(Map.of(
                "message",    "Décision du jury enregistrée",
                "decision",   d.getDecision(),
                "codeDiplome",d.getCodeDiplome() != null ? d.getCodeDiplome() : "—",
                "statut",     d.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // PUBLICATION
    // ══════════════════════════════════════════

    @PatchMapping("/api/deliberations/{id}/publier")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> publier(@PathVariable Long id) {
        try {
            Deliberation d = deliberationService.publier(id);
            return ResponseEntity.ok(Map.of(
                "message",         "Délibération publiée — visible par l'étudiant",
                "datePublication", d.getDatePublication(),
                "statut",          d.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/api/deliberations/departement/{deptId}/{annee}/publier-tout")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> publierTout(
            @PathVariable Long deptId,
            @PathVariable String annee) {
        try {
            int count = deliberationService.publierDepartement(deptId, annee);
            return ResponseEntity.ok(Map.of(
                "message", count + " délibérations publiées"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // CONSULTATION / STATS (Admin)
    // ══════════════════════════════════════════

    @GetMapping("/api/deliberations/universite/{uniId}/{annee}")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<List<Deliberation>> parUniversite(
            @PathVariable Long uniId,
            @PathVariable String annee) {
        return ResponseEntity.ok(deliberationService.parUniversite(uniId, annee));
    }

    @GetMapping("/api/deliberations/universite/{uniId}/{annee}/stats")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> stats(
            @PathVariable Long uniId,
            @PathVariable String annee) {
        return ResponseEntity.ok(deliberationService.statsUniversite(uniId, annee));
    }
}