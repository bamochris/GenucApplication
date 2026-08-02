// cd.genuc.controller.RemboursementController.java
package cd.genuc.controller;

import cd.genuc.model.Remboursement;
import cd.genuc.service.RemboursementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/remboursements")
@RequiredArgsConstructor
public class RemboursementController {

    private final RemboursementService remboursementService;

    // ÉTUDIANT: Demander un remboursement
    @PostMapping("/demander")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> demander(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("paiementId") || !body.containsKey("etudiantId") || !body.containsKey("motif")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "paiementId, etudiantId et motif sont requis"));
            }
            Long paiementId = Long.valueOf(body.get("paiementId").toString());
            Long etudiantId = Long.valueOf(body.get("etudiantId").toString());
            String motif = (String) body.get("motif");
            
            Remboursement r = remboursementService.demander(paiementId, etudiantId, motif);
            return ResponseEntity.ok(Map.of(
                "message", "Demande de remboursement soumise avec succès",
                "id", r.getId(),
                "statut", r.getStatut(),
                "dateDemande", r.getDateDemande()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ÉTUDIANT: Suivre mes demandes
    @GetMapping("/etudiant/{etudiantId}")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> suivi(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(remboursementService.getSuivi(etudiantId));
    }

    // CAISSIER: Vérifier une demande
    @PatchMapping("/{id}/verifier")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> verifier(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("caissierId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "caissierId est requis"));
            }
            Long caissierId = Long.valueOf(body.get("caissierId").toString());
            String commentaire = body.containsKey("commentaire") ? (String) body.get("commentaire") : null;
            
            Remboursement r = remboursementService.verifier(id, caissierId, commentaire);
            return ResponseEntity.ok(Map.of(
                "message", "Demande vérifiée",
                "id", r.getId(),
                "statut", r.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // CHEF DEPARTEMENT: Valider le motif
    @PatchMapping("/{id}/valider-motif")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> validerMotif(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("chefId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "chefId est requis"));
            }
            Long chefId = Long.valueOf(body.get("chefId").toString());
            String commentaire = body.containsKey("commentaire") ? (String) body.get("commentaire") : null;
            
            Remboursement r = remboursementService.validerMotif(id, chefId, commentaire);
            return ResponseEntity.ok(Map.of(
                "message", "Motif validé",
                "id", r.getId(),
                "statut", r.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ADMIN_UNIVERSITE: Autoriser le remboursement
    @PatchMapping("/{id}/autoriser")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> autoriser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("adminId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "adminId est requis"));
            }
            Long adminId = Long.valueOf(body.get("adminId").toString());
            String commentaire = body.containsKey("commentaire") ? (String) body.get("commentaire") : null;
            
            Remboursement r = remboursementService.autoriser(id, adminId, commentaire);
            return ResponseEntity.ok(Map.of(
                "message", "Remboursement autorisé",
                "id", r.getId(),
                "statut", r.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // CAISSIER: Exécuter le remboursement
    @PatchMapping("/{id}/executer")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> executer(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("caissierId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "caissierId est requis"));
            }
            Long caissierId = Long.valueOf(body.get("caissierId").toString());
            String reference = body.containsKey("reference") ? (String) body.get("reference") : null;
            
            Remboursement r = remboursementService.executer(id, caissierId, reference);
            return ResponseEntity.ok(Map.of(
                "message", "Remboursement exécuté",
                "id", r.getId(),
                "statut", r.getStatut(),
                "reference", r.getReferenceRemboursement()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // Rejeter une demande
    @PatchMapping("/{id}/rejeter")
    @PreAuthorize("hasAnyRole('AGENT', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> rejeter(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("agentId") || !body.containsKey("motif")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "agentId et motif sont requis"));
            }
            Long agentId = Long.valueOf(body.get("agentId").toString());
            String motif = (String) body.get("motif");
            
            Remboursement r = remboursementService.rejeter(id, agentId, motif);
            return ResponseEntity.ok(Map.of(
                "message", "Demande rejetée",
                "id", r.getId(),
                "statut", r.getStatut(),
                "motif", motif
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // Détail d'une demande
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(remboursementService.obtenir(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}