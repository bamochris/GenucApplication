package cd.genuc.controller;

import cd.genuc.model.Echeancier;
import cd.genuc.model.ParametresUniversite;
import cd.genuc.service.EcheancierService;
import cd.genuc.service.ParametresUniversiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/echeanciers")
@RequiredArgsConstructor
public class EcheancierController {

    private final EcheancierService echeancierService;
    private final ParametresUniversiteService parametresService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE', 'AGENT')")
    public ResponseEntity<?> creerEcheancier(@RequestBody Map<String, Object> body) {
        try {
            String[] required = {"inscriptionId", "libelle", "montantTotal", "nombreEcheances"};
            for (String key : required) {
                if (!body.containsKey(key)) {
                    return ResponseEntity.badRequest().body(Map.of("erreur", key + " est requis"));
                }
            }
            
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            String libelle = (String) body.get("libelle");
            Double montantTotal = Double.valueOf(body.get("montantTotal").toString());
            Integer nombreEcheances = Integer.valueOf(body.get("nombreEcheances").toString());
            String description = body.containsKey("description") ? (String) body.get("description") : null;

            Echeancier echeancier = echeancierService.creerEcheancier(
                    inscriptionId, libelle, montantTotal, nombreEcheances, description
            );
            return ResponseEntity.ok(echeancier);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/generer-auto")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE', 'AGENT')")
    public ResponseEntity<?> genererEcheancierAuto(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("inscriptionId") || !body.containsKey("universiteId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "inscriptionId et universiteId sont requis"));
            }
            
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            ParametresUniversite parametres = parametresService.getParametresParUniversite(
                    Long.valueOf(body.get("universiteId").toString())
            );
            Echeancier echeancier = echeancierService.genererEcheancierAutomatique(inscriptionId, parametres);
            return ResponseEntity.ok(echeancier);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/inscription/{inscriptionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getByInscription(@PathVariable Long inscriptionId) {
        return ResponseEntity.ok(echeancierService.getEcheanciersParInscription(inscriptionId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getComplet(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(echeancierService.getEcheancierComplet(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> annuler(@PathVariable Long id) {
        echeancierService.annulerEcheancier(id);
        return ResponseEntity.ok(Map.of("message", "Échéancier annulé"));
    }

    @GetMapping("/{id}/situation")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getSituation(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(echeancierService.getEcheancierComplet(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}