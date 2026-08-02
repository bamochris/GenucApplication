package cd.genuc.controller;

import cd.genuc.service.EmploiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/emploi")
@RequiredArgsConstructor
public class EmploiController {

    private final EmploiService emploiService;

    /** Offres accessibles sans authentification (page publique) */
    @GetMapping("/offres/publiques")
    public ResponseEntity<?> getOffresPubliques(
            @RequestParam(required = false) String secteur,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(emploiService.getOffresPubliques(secteur, type, page, size));
    }

    /** Liste des offres d'emploi (avec matching IA si etudiantId fourni) */
    @GetMapping("/offres")
    public ResponseEntity<?> getOffres(
            @RequestParam(required = false) Long etudiantId,
            @RequestParam(required = false) String secteur,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(emploiService.getOffres(etudiantId, secteur, type, page, size));
    }

    /** Soumettre une candidature */
    @PostMapping("/candidature")
    @PreAuthorize("hasAnyRole('ETUDIANT','ALUMNI')")
    public ResponseEntity<?> postuler(@RequestBody Map<String, Object> body) {
        Long offreId = Long.valueOf(body.get("offreId").toString());
        Long etudiantId = Long.valueOf(body.get("etudiantId").toString());
        return ResponseEntity.ok(emploiService.postuler(offreId, etudiantId));
    }

    /** Annuaire alumni */
    @GetMapping("/alumni/annuaire")
    public ResponseEntity<?> annuaire(
            @RequestParam(required = false) Long universiteId,
            @RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok(emploiService.getAnnuaire(universiteId, limit));
    }

    /** Profil alumni d'un utilisateur */
    @GetMapping("/alumni/{userId}/profil")
    public ResponseEntity<?> profilAlumni(@PathVariable Long userId) {
        return ResponseEntity.ok(emploiService.getProfilAlumni(userId));
    }

    /** Publier une offre (employeur) */
    @PostMapping("/offres/publier")
    @PreAuthorize("hasAnyRole('EMPLOYEUR','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> publierOffre(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(emploiService.publierOffre(body));
    }
}
