package cd.genuc.controller;

import cd.genuc.model.Message;
import cd.genuc.service.MessagerieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/messagerie")
@RequiredArgsConstructor
public class MessagerieController {

    private final MessagerieService messagerieService;

    // ═══════════════════════════════════════════════════════════════
    // ÉTUDIANT - Récupérer ses messages
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/etudiant/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> getMessagesEtudiant(@PathVariable Long inscriptionId) {
        try {
            return ResponseEntity.ok(messagerieService.getMessagesEtudiant(inscriptionId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN / PROFESSEUR - Récupérer ses messages
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/admin/{utilisateurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getMessagesAdmin(@PathVariable Long utilisateurId) {
        try {
            return ResponseEntity.ok(messagerieService.getMessagesAdmin(utilisateurId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ENVOYER UN MESSAGE
    // ═══════════════════════════════════════════════════════════════

    @PostMapping("/envoyer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> envoyerMessage(@RequestBody Map<String, Object> body) {
        try {
            String[] required = {"sujet", "contenu"};
            for (String key : required) {
                if (!body.containsKey(key)) {
                    return ResponseEntity.badRequest().body(Map.of("erreur", key + " est requis"));
                }
            }

            boolean hasRouting = body.containsKey("destinataire")
                    || body.containsKey("destinataireId")
                    || body.containsKey("destinataireIds")
                    || body.containsKey("inscriptionIds")
                    || body.containsKey("cibleType");

            if (!hasRouting) {
                return ResponseEntity.badRequest().body(Map.of(
                        "erreur", "Un destinataire, une liste de destinataires ou un type de cible est requis"
                ));
            }

            var messages = messagerieService.envoyerMessages(body);
            Message message = messages.get(0);
            return ResponseEntity.ok(Map.of(
                "message", "Message envoyé avec succès",
                "count", messages.size(),
                "id", message.getId(),
                "dateEnvoi", message.getDateEnvoi().toString()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // MARQUER UN MESSAGE COMME LU
    // ═══════════════════════════════════════════════════════════════

    @PatchMapping("/{id}/lu")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> marquerLu(@PathVariable Long id) {
        try {
            messagerieService.marquerLu(id);
            return ResponseEntity.ok(Map.of("message", "Message marqué comme lu"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // RÉPONDRE À UN MESSAGE (ADMIN)
    // ═══════════════════════════════════════════════════════════════

    @PostMapping("/{id}/repondre")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> repondreMessage(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("reponse") || !body.containsKey("reponseParId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "reponse et reponseParId sont requis"));
            }
            String reponse = (String) body.get("reponse");
            Long reponseParId = Long.valueOf(body.get("reponseParId").toString());
            String reponseParNom = (String) body.get("reponseParNom");

            Message message = messagerieService.repondreMessage(id, reponse, reponseParId, reponseParNom);
            return ResponseEntity.ok(Map.of(
                "message", "Réponse envoyée",
                "dateReponse", message.getDateReponse().toString()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTACTS DISPONIBLES POUR UNE UNIVERSITÉ
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/contacts/{universiteId}")
    @PreAuthorize("isAuthenticated()"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<?> getContacts(@PathVariable Long universiteId) {
        try {
            return ResponseEntity.ok(messagerieService.getContactsUniversite(universiteId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/admin/cibles/{universiteId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<?> getCiblesAdmin(@PathVariable Long universiteId) {
        try {
            return ResponseEntity.ok(messagerieService.getCiblesMessagerieAdmin(universiteId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // NOMBRE DE MESSAGES NON LUS
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/non-lus/{destinataireId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> countNonLus(@PathVariable Long destinataireId) {
        try {
            long count = messagerieService.countNonLus(destinataireId);
            return ResponseEntity.ok(Map.of("nonLus", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}
