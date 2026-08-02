package cd.genuc.controller;

import cd.genuc.model.Presence;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/presences")
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;

    // ─── Professeur / Admin : générer QR code pour une séance ───
    @GetMapping("/generer-qr")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> genererQrCode(@RequestParam Long coursId,
                                                @RequestParam(required = false) Long seanceId) {
        try {
            byte[] qrImage = presenceService.genererQrCode(coursId, seanceId);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(qrImage);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ─── Étudiant : scanner le QR code (enregistrer présence) ───
    @PostMapping("/scanner")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> scanner(@RequestBody Map<String, String> body,
                                     @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            String payload = body.get("payload");
            // Récupération sécurisée de l'ID étudiant depuis l'utilisateur authentifié
            Long etudiantId = currentUser.getInscriptionId();
            if (etudiantId == null) {
                throw new RuntimeException("Aucune inscription associée à cet utilisateur");
            }
            Presence presence = presenceService.enregistrerPresence(payload, etudiantId);
            return ResponseEntity.ok(Map.of(
                    "message", "Présence enregistrée à " + presence.getHeureArrivee(),
                    "id", presence.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── Étudiant : consulter ses présences ───
    @GetMapping("/etudiant/{etudiantId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'PROFESSEUR', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<List<Presence>> getPresencesEtudiant(@PathVariable Long etudiantId,
                                                               @RequestParam(required = false) Long coursId) {
        return ResponseEntity.ok(presenceService.getPresencesEtudiant(etudiantId, coursId));
    }

    // ─── Professeur : consulter les présences d'un cours (liste brute) ───
    @GetMapping("/cours/{coursId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<List<Presence>> getPresencesCours(@PathVariable Long coursId,
                                                            @RequestParam(required = false) LocalDate date) {
        return ResponseEntity.ok(presenceService.getPresencesCours(coursId, date));
    }

    // ─── Professeur : tableau de bord des présences (étudiants + statut) ───
    @GetMapping("/cours/{coursId}/tableau")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> getTableauPresences(@PathVariable Long coursId,
                                                 @RequestParam(required = false) LocalDate date) {
        if (date == null) date = LocalDate.now();
        List<Map<String, Object>> data = presenceService.getTableauPresences(coursId, date);
        long nbPresent = data.stream().filter(row -> (Boolean) row.get("present")).count();
        return ResponseEntity.ok(Map.of(
                "coursId", coursId,
                "date", date.toString(),
                "effectifTotal", data.size(),
                "nbPresent", nbPresent,
                "presences", data
        ));
    }

    // ─── Professeur : saisie manuelle groupée des présences (upsert) ───
    @PostMapping("/cours/{coursId}/saisie")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> saisirPresences(@PathVariable Long coursId,
                                             @RequestBody Map<String, Object> body) {
        try {
            LocalDate date = LocalDate.parse((String) body.get("date"));
            List<Map<String, Object>> presences = (List<Map<String, Object>>) body.get("presences");
            List<Presence> resultats = presenceService.saisirPresences(coursId, date, presences);
            return ResponseEntity.ok(Map.of(
                    "message", "Présences enregistrées avec succès",
                    "nbEnregistrees", resultats.size()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── Professeur : justifier une absence (marquer comme justifiée) ───
    @PatchMapping("/{presenceId}/justifier")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> justifierPresence(@PathVariable Long presenceId) {
        try {
            Presence p = presenceService.justifierPresence(presenceId);
            return ResponseEntity.ok(Map.of(
                    "message", "Absence justifiée",
                    "justifie", p.isJustifie()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}