package cd.genuc.controller;

import cd.genuc.model.Association;
import cd.genuc.model.EvenementUniversitaire;
import cd.genuc.service.VieUniversitaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Vie universitaire : clubs / associations et événements étudiants.
 * Consommé par VieUniversitaire.jsx (étudiant).
 */
@RestController
@RequestMapping("/api/vie-universitaire")
@RequiredArgsConstructor
public class VieUniversitaireController {

    private final VieUniversitaireService service;

    // ─────────────────────────────────────────────
    // CLUBS
    // ─────────────────────────────────────────────

    @GetMapping("/clubs/{universiteId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'CHEF_DEPARTEMENT', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> listerClubs(@PathVariable Long universiteId) {
        return ResponseEntity.ok(service.listerClubs(universiteId));
    }

    @GetMapping("/etudiant/{inscriptionId}/clubs")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> listerClubsEtudiant(@PathVariable Long inscriptionId) {
        return ResponseEntity.ok(service.listerClubsEtudiant(inscriptionId));
    }

    @PostMapping("/clubs")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerClub(@RequestBody Map<String, Object> body) {
        try {
            Association association = service.creerClub(body);
            return ResponseEntity.ok(association);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/clubs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> modifierClub(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(service.modifierClub(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/clubs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> supprimerClub(@PathVariable Long id) {
        try {
            service.supprimerClub(id);
            return ResponseEntity.ok(Map.of("message", "Club supprimé"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/clubs/{clubId}/rejoindre")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> rejoindreClub(@PathVariable Long clubId, @RequestBody Map<String, Object> body) {
        try {
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            service.rejoindreClub(clubId, inscriptionId);
            return ResponseEntity.ok(Map.of("message", "Adhésion réussie"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/clubs/{clubId}/quitter")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> quitterClub(@PathVariable Long clubId, @RequestBody Map<String, Object> body) {
        try {
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            service.quitterClub(clubId, inscriptionId);
            return ResponseEntity.ok(Map.of("message", "Vous avez quitté le club"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // ÉVÉNEMENTS
    // ─────────────────────────────────────────────

    @GetMapping("/evenements/{universiteId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'CHEF_DEPARTEMENT', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> listerEvenements(@PathVariable Long universiteId) {
        return ResponseEntity.ok(service.listerEvenements(universiteId));
    }

    @PostMapping("/evenements")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerEvenement(@RequestBody Map<String, Object> body) {
        try {
            EvenementUniversitaire evenement = service.creerEvenement(body);
            return ResponseEntity.ok(evenement);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/evenements/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> modifierEvenement(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(service.modifierEvenement(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/evenements/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> supprimerEvenement(@PathVariable Long id) {
        try {
            service.supprimerEvenement(id);
            return ResponseEntity.ok(Map.of("message", "Événement supprimé"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/evenements/{eventId}/inscrire")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> inscrireEvenement(@PathVariable Long eventId, @RequestBody Map<String, Object> body) {
        try {
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            service.inscrireEvenement(eventId, inscriptionId);
            return ResponseEntity.ok(Map.of("message", "Inscription réussie"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
