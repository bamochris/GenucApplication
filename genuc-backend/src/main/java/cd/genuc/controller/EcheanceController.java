package cd.genuc.controller;

import cd.genuc.model.Paiement;
import cd.genuc.service.EcheancePaiementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/echeances")
@RequiredArgsConstructor
public class EcheanceController {

    private final EcheancePaiementService echeancePaiementService;

    @PostMapping("/{id}/payer")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'ETUDIANT')")
    public ResponseEntity<?> payerEcheance(@PathVariable Long id,
                                           @RequestBody Map<String, Object> body) {
        try {
            // Vérification des champs obligatoires
            if (!body.containsKey("montant")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "montant est requis"));
            }
            // Autres champs optionnels
            Map<String, Object> paiementData = (Map<String, Object>) body.getOrDefault("paiementData", Map.of());
            
            Paiement paiement = echeancePaiementService.payerEcheance(id, paiementData);
            return ResponseEntity.ok(Map.of(
                    "message", "Échéance payée avec succès",
                    "paiementId", paiement.getId(),
                    "reference", paiement.getReference(),
                    "montant", paiement.getMontant()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/payer-lot")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> payerEcheances(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("echeancierId") || !body.containsKey("echeanceIds") || !body.containsKey("paiementData")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "echeancierId, echeanceIds et paiementData sont requis"));
            }
            Long echeancierId = Long.valueOf(body.get("echeancierId").toString());
            List<Long> echeanceIds = (List<Long>) body.get("echeanceIds");
            Map<String, Object> data = (Map<String, Object>) body.get("paiementData");

            Paiement paiement = echeancePaiementService.payerEcheances(echeancierId, echeanceIds, data);
            return ResponseEntity.ok(Map.of(
                    "message", "Échéances payées avec succès",
                    "paiementId", paiement.getId(),
                    "reference", paiement.getReference(),
                    "montant", paiement.getMontant()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/echeancier/{echeancierId}/situation")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getSituation(@PathVariable Long echeancierId) {
        try {
            return ResponseEntity.ok(echeancePaiementService.getSituationEcheancier(echeancierId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/universite/{universiteId}/a-recouvrer")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getEcheancesARecouvrer(@PathVariable Long universiteId) {
        return ResponseEntity.ok(echeancePaiementService.echeancesARecouvrer(universiteId));
    }
}