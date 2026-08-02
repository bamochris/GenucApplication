package cd.genuc.controller;

import cd.genuc.service.EmploiUniversitaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/emploi-universitaire")
@RequiredArgsConstructor
public class EmploiUniversitaireController {

    private final EmploiUniversitaireService service;

    /* ── Offres publiques (sans authentification) ── */

    @GetMapping("/offres/publiques")
    public ResponseEntity<?> offresPubliques(
            @RequestParam(required = false) Long universiteId,
            @RequestParam(required = false) String categorie,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.getOffresPubliques(universiteId, categorie, page, size));
    }

    @GetMapping("/offres/{id}")
    public ResponseEntity<?> detailOffre(@PathVariable Long id) {
        return ResponseEntity.ok(service.getDetailOffre(id));
    }

    /* ── Candidatures (étudiant connecté) ── */

    @PostMapping("/candidatures")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> postuler(
            @RequestParam Long offreId,
            @RequestParam Long etudiantId,
            @RequestParam String motivation,
            @RequestParam(required = false) MultipartFile cv) {
        return ResponseEntity.ok(service.postuler(offreId, etudiantId, motivation, cv));
    }

    @GetMapping("/candidatures/etudiant/{etudiantId}")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> mesCandidatures(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(service.getMesCandidatures(etudiantId));
    }

    @GetMapping("/mes-contrats/{etudiantId}")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> mesContrats(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(service.getMesContrats(etudiantId));
    }

    @GetMapping("/mes-heures/{etudiantId}")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> mesHeures(
            @PathVariable Long etudiantId,
            @RequestParam(required = false) String mois) {
        return ResponseEntity.ok(service.getMesHeures(etudiantId, mois));
    }

    /* ── Gestion RH (admin université) ── */

    @GetMapping("/admin/offres")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','RH')")
    public ResponseEntity<?> adminOffres(@RequestParam(required = false) Long universiteId) {
        return ResponseEntity.ok(service.getOffresAdmin(universiteId));
    }

    @PostMapping("/admin/offres")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','RH')")
    public ResponseEntity<?> creerOffre(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.creerOffre(body));
    }

    @PutMapping("/admin/offres/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','RH')")
    public ResponseEntity<?> modifierOffre(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.modifierOffre(id, body));
    }

    @DeleteMapping("/admin/offres/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','RH')")
    public ResponseEntity<?> supprimerOffre(@PathVariable Long id) {
        service.supprimerOffre(id);
        return ResponseEntity.ok(Map.of("message", "Offre supprimée"));
    }

    @GetMapping("/admin/candidatures/{offreId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','RH')")
    public ResponseEntity<?> candidaturesOffre(@PathVariable Long offreId) {
        return ResponseEntity.ok(service.getCandidaturesOffre(offreId));
    }

    @PostMapping("/admin/candidatures/{candidatureId}/traiter")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','RH')")
    public ResponseEntity<?> traiterCandidature(
            @PathVariable Long candidatureId,
            @RequestBody Map<String, Object> body) {
        String decision = (String) body.get("decision"); /* ACCEPTEE | REJETEE */
        String message = (String) body.getOrDefault("message", "");
        return ResponseEntity.ok(service.traiterCandidature(candidatureId, decision, message));
    }

    @PostMapping("/admin/pointage")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','RH')")
    public ResponseEntity<?> enregistrerPointage(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.enregistrerPointage(body));
    }

    @GetMapping("/admin/salaires/{mois}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN','RH','COMPTABLE')")
    public ResponseEntity<?> rapportSalaires(
            @PathVariable String mois,
            @RequestParam(required = false) Long universiteId) {
        return ResponseEntity.ok(service.getRapportSalaires(mois, universiteId));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> statsPubliques() {
        return ResponseEntity.ok(service.getStatsPubliques());
    }
}
