package cd.genuc.controller;

import cd.genuc.model.Conge;
import cd.genuc.service.CongeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conges")
@RequiredArgsConstructor
public class CongeController {

    private final CongeService congeService;

    @PostMapping("/demander")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'PERSONNEL', 'RH', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> demanderConge(@RequestBody Map<String, Object> body) {
        try {
            // Vérification des champs obligatoires
            String[] required = {"personnelId", "libelle", "dateDebut", "dateFin"};
            for (String key : required) {
                if (!body.containsKey(key)) {
                    return ResponseEntity.badRequest().body(Map.of("erreur", key + " est requis"));
                }
            }
            Long personnelId = Long.valueOf(body.get("personnelId").toString());
            String libelle = (String) body.get("libelle");
            LocalDate dateDebut = LocalDate.parse((String) body.get("dateDebut"));
            LocalDate dateFin = LocalDate.parse((String) body.get("dateFin"));
            String commentaire = body.containsKey("commentaire") ? (String) body.get("commentaire") : null;

            Conge conge = congeService.demanderConge(personnelId, libelle, dateDebut, dateFin, commentaire);
            return ResponseEntity.ok(Map.of(
                    "message", "Demande de congé soumise",
                    "id", conge.getId(),
                    "statut", conge.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/valider")
    @PreAuthorize("hasRole('RH')")
    public ResponseEntity<?> validerConge(@PathVariable Long id,
                                          @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("valideurId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "valideurId est requis"));
            }
            Long valideurId = Long.valueOf(body.get("valideurId").toString());
            String commentaire = body.containsKey("commentaire") ? (String) body.get("commentaire") : null;
            Conge conge = congeService.validerConge(id, valideurId, commentaire);
            return ResponseEntity.ok(Map.of(
                    "message", "Congé validé",
                    "id", conge.getId(),
                    "statut", conge.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/rejeter")
    @PreAuthorize("hasRole('RH')")
    public ResponseEntity<?> rejeterConge(@PathVariable Long id,
                                          @RequestBody Map<String, Object> body) {
        try {
            String motif = body.containsKey("motif") ? (String) body.get("motif") : "Non spécifié";
            Conge conge = congeService.rejeterConge(id, motif);
            return ResponseEntity.ok(Map.of(
                    "message", "Congé rejeté",
                    "id", conge.getId(),
                    "statut", conge.getStatut().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/personnel/{personnelId}")
    @PreAuthorize("hasAnyRole('RH', 'ADMIN_UNIVERSITE', 'PERSONNEL')")
    public ResponseEntity<List<Conge>> getCongesPersonnel(@PathVariable Long personnelId) {
        return ResponseEntity.ok(congeService.getCongesPersonnel(personnelId));
    }

    @GetMapping("/en-attente")
    @PreAuthorize("hasRole('RH')")
    public ResponseEntity<?> getCongesEnAttente(@RequestParam Long universiteId) {
        return ResponseEntity.ok(congeService.getCongesEnAttente(universiteId));
    }
}