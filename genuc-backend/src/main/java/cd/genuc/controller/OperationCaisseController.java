package cd.genuc.controller;

import cd.genuc.model.OperationCaisse;
import cd.genuc.service.OperationCaisseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/caisse/operations")
@RequiredArgsConstructor
public class OperationCaisseController {

    private final OperationCaisseService operationService;

    @GetMapping("/caisse/{caisseId}")
    @PreAuthorize("hasAnyRole('CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<OperationCaisse>> getOperations(@PathVariable Long caisseId) {
        return ResponseEntity.ok(operationService.getOperationsParCaisse(caisseId));
    }

    @GetMapping("/caisse/{caisseId}/solde")
    @PreAuthorize("hasAnyRole('CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getSolde(@PathVariable Long caisseId) {
        Map<String, Object> solde = operationService.getSoldeCaisse(caisseId);
        return ResponseEntity.ok(Map.of("solde", solde));
    }

    // Endpoint pour enregistrer manuellement une opération (si besoin)
    @PostMapping
    @PreAuthorize("hasRole('CAISSIER')")
    public ResponseEntity<?> enregistrerOperation(@RequestBody Map<String, Object> body) {
        try {
            String[] required = {"caisseId", "type", "montant", "effectueParId"};
            for (String key : required) {
                if (!body.containsKey(key)) {
                    return ResponseEntity.badRequest().body(Map.of("erreur", key + " est requis"));
                }
            }
            Long caisseId = Long.valueOf(body.get("caisseId").toString());
            OperationCaisse.TypeOperation type = OperationCaisse.TypeOperation.valueOf(body.get("type").toString());
            Double montant = Double.valueOf(body.get("montant").toString());
            String reference = body.containsKey("reference") ? (String) body.get("reference") : null;
            String description = body.containsKey("description") ? (String) body.get("description") : null;
            Long effectueParId = Long.valueOf(body.get("effectueParId").toString());

            OperationCaisse op = operationService.enregistrerOperation(caisseId, type, montant, reference, description, effectueParId);
            return ResponseEntity.ok(op);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}