package cd.genuc.controller;

import cd.genuc.dto.BourseOffreDto;
import cd.genuc.dto.CandidatureBourseDto;
import cd.genuc.model.BourseOffre;
import cd.genuc.model.CandidatureBourse;
import cd.genuc.service.BourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bourses")
@RequiredArgsConstructor
public class BourseController {

    private final BourseService bourseService;

    // ─── Étudiant : consultation et candidature ──────────────────

    @GetMapping("/disponibles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BourseOffreDto>> listerDisponibles() {
        List<BourseOffreDto> dtos = bourseService.listerOffresDisponibles()
                .stream().map(BourseOffreDto::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping(value = "/postuler", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> postuler(@RequestParam Long bourseId,
                                       @RequestParam Long etudiantId,
                                       @RequestParam(required = false) String motivation,
                                       @RequestParam(required = false) MultipartFile pieces) {
        try {
            CandidatureBourse candidature = bourseService.postuler(bourseId, etudiantId, motivation, pieces);
            return ResponseEntity.status(HttpStatus.CREATED).body(CandidatureBourseDto.fromEntity(candidature));
        } catch (RuntimeException | java.io.IOException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/mes-demandes/{etudiantId}")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<List<CandidatureBourseDto>> mesDemandes(@PathVariable Long etudiantId) {
        List<CandidatureBourseDto> dtos = bourseService.getCandidaturesEtudiant(etudiantId)
                .stream().map(CandidatureBourseDto::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    // ─── Admin / Service social : gestion des offres ─────────────

    @GetMapping("/admin/offres")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<BourseOffreDto>> listerToutesOffres() {
        List<BourseOffreDto> dtos = bourseService.listerToutesOffres()
                .stream().map(BourseOffreDto::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/admin/offres")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerOffre(@RequestBody BourseOffre offre) {
        try {
            BourseOffre saved = bourseService.creerOffre(offre);
            return ResponseEntity.status(HttpStatus.CREATED).body(BourseOffreDto.fromEntity(saved));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/offres/{id}")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> desactiverOffre(@PathVariable Long id) {
        try {
            bourseService.desactiverOffre(id);
            return ResponseEntity.ok(Map.of("message", "Offre de bourse désactivée"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── Admin / Service social : gestion des candidatures ───────

    @GetMapping("/admin/candidatures/{universiteId}")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<List<CandidatureBourseDto>> getCandidaturesUniversite(@PathVariable Long universiteId) {
        List<CandidatureBourseDto> dtos = bourseService.getCandidaturesParUniversite(universiteId)
                .stream().map(CandidatureBourseDto::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    @PatchMapping("/admin/candidatures/{id}/approuver")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> approuver(@PathVariable Long id) {
        try {
            CandidatureBourse candidature = bourseService.approuverCandidature(id);
            return ResponseEntity.ok(CandidatureBourseDto.fromEntity(candidature));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/admin/candidatures/{id}/rejeter")
    @PreAuthorize("hasAnyRole('SERVICE_SOCIAL', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> rejeter(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        try {
            String motif = body != null ? body.get("motifRejet") : null;
            CandidatureBourse candidature = bourseService.rejeterCandidature(id, motif);
            return ResponseEntity.ok(CandidatureBourseDto.fromEntity(candidature));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
