package cd.genuc.controller;

import cd.genuc.service.EmploiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alumni")
@RequiredArgsConstructor
public class AlumniController {

    private final EmploiService emploiService;

    @GetMapping("/{userId}/profil")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> profil(@PathVariable Long userId) {
        return ResponseEntity.ok(emploiService.getProfilAlumni(userId));
    }

    @GetMapping("/annuaire")
    public ResponseEntity<?> annuaire(
            @RequestParam(required = false) Long universiteId,
            @RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok(emploiService.getAnnuaire(universiteId, limit));
    }
}
