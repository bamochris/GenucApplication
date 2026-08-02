package cd.genuc.controller;

import cd.genuc.model.SoumissionTravail;
import cd.genuc.model.TravauxDevoir;
import cd.genuc.service.TravauxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/travaux")
@RequiredArgsConstructor
public class TravauxController {

    private final TravauxService travauxService;

    // ══════════════════════════════════════════
    // Professeur : créer / lister les travaux
    // ══════════════════════════════════════════

    @PostMapping
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerTravail(@RequestBody Map<String, Object> body) {
        try {
            TravauxDevoir travail = travauxService.creerTravail(body);
            return ResponseEntity.ok(travail);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/professeur/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<TravauxDevoir>> travauxDuProfesseur(@PathVariable Long professeurId) {
        return ResponseEntity.ok(travauxService.travauxDuProfesseur(professeurId));
    }

    @GetMapping("/cours/{coursId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<TravauxDevoir>> travauxDuCours(@PathVariable Long coursId) {
        return ResponseEntity.ok(travauxService.travauxDuCours(coursId));
    }

    // ══════════════════════════════════════════
    // Étudiant : soumettre un travail
    // ══════════════════════════════════════════

    @PostMapping("/soumettre")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> soumettre(@RequestParam Long travailId,
                                        @RequestParam Long inscriptionId,
                                        @RequestParam(required = false) String commentaire,
                                        @RequestParam MultipartFile fichier) {
        try {
            SoumissionTravail soumission = travauxService.soumettre(travailId, inscriptionId, commentaire, fichier);
            return ResponseEntity.ok(Map.of(
                    "message", "Travail soumis avec succès",
                    "id", soumission.getId(),
                    "statut", soumission.getStatut().name()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // Professeur : lister / corriger les soumissions
    // ══════════════════════════════════════════

    @GetMapping("/{travailId}/soumissions")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> soumissionsDuTravail(@PathVariable Long travailId) {
        return ResponseEntity.ok(travauxService.soumissionsDuTravail(travailId));
    }

    @PatchMapping("/soumissions/{soumissionId}/noter")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> noterSoumission(@PathVariable Long soumissionId, @RequestBody Map<String, Object> body) {
        try {
            Double note = body.get("note") != null ? Double.valueOf(body.get("note").toString()) : null;
            String commentaireCorrection = (String) body.get("commentaireCorrection");
            String urlCorrection = (String) body.get("urlCorrection");
            SoumissionTravail soumission = travauxService.noterSoumission(soumissionId, note, commentaireCorrection, urlCorrection);
            return ResponseEntity.ok(Map.of(
                    "message", "Soumission corrigée",
                    "id", soumission.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
