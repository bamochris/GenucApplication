package cd.genuc.controller;

import cd.genuc.service.LMSService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/lms")
@RequiredArgsConstructor
public class LMSController {

    private final LMSService lmsService;

    /* ── Chapitres ── */

    @GetMapping("/cours/{coursId}/chapitres")
    public ResponseEntity<?> getChapitres(@PathVariable Long coursId) {
        return ResponseEntity.ok(lmsService.getChapitres(coursId));
    }

    @PostMapping("/cours/{coursId}/chapitres")
    @PreAuthorize("hasRole('PROFESSEUR')")
    public ResponseEntity<?> ajouterChapitre(
            @PathVariable Long coursId,
            @RequestParam String titre,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "1") int ordre,
            @RequestParam(required = false) MultipartFile fichier) {
        return ResponseEntity.ok(lmsService.ajouterChapitre(coursId, titre, description, ordre, fichier));
    }

    @DeleteMapping("/chapitres/{chapitreId}")
    @PreAuthorize("hasRole('PROFESSEUR')")
    public ResponseEntity<?> supprimerChapitre(@PathVariable Long chapitreId) {
        lmsService.supprimerChapitre(chapitreId);
        return ResponseEntity.ok(Map.of("message", "Chapitre supprimé"));
    }

    @PostMapping("/chapitres/{chapitreId}/marquer-vu")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> marquerVu(@PathVariable Long chapitreId) {
        return ResponseEntity.ok(lmsService.marquerVu(chapitreId));
    }

    /* ── Quiz ── */

    @GetMapping("/cours/{coursId}/quiz")
    public ResponseEntity<?> getQuiz(@PathVariable Long coursId) {
        return ResponseEntity.ok(lmsService.getQuiz(coursId));
    }

    @PostMapping("/cours/{coursId}/quiz")
    @PreAuthorize("hasRole('PROFESSEUR')")
    public ResponseEntity<?> ajouterQuestion(@PathVariable Long coursId, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(lmsService.ajouterQuestion(coursId, body));
    }

    @PostMapping("/cours/{coursId}/quiz/soumettre")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> soumettreQuiz(@PathVariable Long coursId, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(lmsService.soumettreQuiz(coursId, body));
    }

    /* ── Devoirs ── */

    @GetMapping("/cours/{coursId}/devoirs")
    public ResponseEntity<?> getDevoirs(@PathVariable Long coursId) {
        return ResponseEntity.ok(lmsService.getDevoirs(coursId));
    }

    @PostMapping("/cours/{coursId}/devoirs")
    @PreAuthorize("hasRole('PROFESSEUR')")
    public ResponseEntity<?> creerDevoir(@PathVariable Long coursId, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(lmsService.creerDevoir(coursId, body));
    }

    @PostMapping("/devoirs/{devoirId}/soumettre")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> soumettreDevoir(
            @PathVariable Long devoirId,
            @RequestParam Long etudiantId,
            @RequestParam MultipartFile fichier) {
        return ResponseEntity.ok(lmsService.soumettreDevoir(devoirId, etudiantId, fichier));
    }

    /* ── Progression ── */

    @GetMapping("/cours/{coursId}/ma-progression")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> maProgression(@PathVariable Long coursId) {
        return ResponseEntity.ok(lmsService.getMaProgression(coursId));
    }

    /* ── Statistiques ── */

    @GetMapping("/cours/{coursId}/statistiques")
    @PreAuthorize("hasRole('PROFESSEUR')")
    public ResponseEntity<?> getStatistiques(@PathVariable Long coursId) {
        return ResponseEntity.ok(lmsService.getStatistiques(coursId));
    }
}
