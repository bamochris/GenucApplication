package cd.genuc.controller;

import cd.genuc.model.CalendrierAcademique;
import cd.genuc.service.CalendrierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendrier")
@RequiredArgsConstructor
public class CalendrierController {

    private final CalendrierService calendrierService;

    @GetMapping("/universite/{universiteId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CalendrierAcademique>> getEvenements(@PathVariable Long universiteId) {
        return ResponseEntity.ok(calendrierService.getEvenementsParUniversite(universiteId));
    }

    @GetMapping("/universite/{universiteId}/actifs")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CalendrierAcademique>> getEvenementsActifs(@PathVariable Long universiteId) {
        return ResponseEntity.ok(calendrierService.getEvenementsActifsParUniversite(universiteId));
    }

    @GetMapping("/universite/{universiteId}/date")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getEvenementsParDate(@PathVariable Long universiteId,
                                                   @RequestParam String date) {
        LocalDate d = LocalDate.parse(date);
        return ResponseEntity.ok(calendrierService.getEvenementsParDate(universiteId, d));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> creerEvenement(@RequestBody CalendrierAcademique evenement) {
        try {
            return ResponseEntity.ok(calendrierService.creerEvenement(evenement));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> modifierEvenement(@PathVariable Long id,
                                               @RequestBody CalendrierAcademique evenement) {
        try {
            return ResponseEntity.ok(calendrierService.modifierEvenement(id, evenement));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> supprimerEvenement(@PathVariable Long id) {
        calendrierService.supprimerEvenement(id);
        return ResponseEntity.ok(Map.of("message", "Événement supprimé"));
    }

    @PatchMapping("/{id}/desactiver")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> desactiverEvenement(@PathVariable Long id) {
        calendrierService.desactiverEvenement(id);
        return ResponseEntity.ok(Map.of("message", "Événement désactivé"));
    }
}