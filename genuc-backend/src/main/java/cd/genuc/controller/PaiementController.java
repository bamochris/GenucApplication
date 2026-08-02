package cd.genuc.controller;

import cd.genuc.model.BaremePaiement;
import cd.genuc.model.Paiement;
import cd.genuc.security.SecurityService;
import cd.genuc.service.PaiementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API REST — Paiements GENUC
 * ✅ ÉTAPE 5 : Pagination implémentée sur les listes
 * ✅ ÉTAPE 5 : Documentation Swagger complétée
 */
@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
@Tag(name = "Paiements", description = "Gestion des paiements étudiants")
public class PaiementController {

    private final PaiementService paiementService;
    private final SecurityService securityService;

    // ══════════════════════════════════════════
    // ÉTUDIANT
    // ══════════════════════════════════════════

    @PostMapping("/etudiant")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Soumettre un paiement", description = "Soumet un nouveau paiement depuis le portail étudiant ou par un agent")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Paiement créé avec succès",
                     content = @Content(schema = @Schema(implementation = Paiement.class))),
        @ApiResponse(responseCode = "400", description = "Données invalides"),
        @ApiResponse(responseCode = "401", description = "Non authentifié"),
        @ApiResponse(responseCode = "403", description = "Accès refusé"),
        @ApiResponse(responseCode = "404", description = "Inscription ou université non trouvée")
    })
    public ResponseEntity<?> soumettre(@RequestBody Map<String, Object> body) {
        try {
            String[] required = {"inscriptionId", "montant", "typePaiement"};
            for (String key : required) {
                if (!body.containsKey(key)) {
                    return ResponseEntity.badRequest().body(Map.of("erreur", key + " est requis"));
                }
            }
            // L'inscriptionId vient du corps : le SpEL de @PreAuthorize ne peut pas le lire,
            // on vérifie donc ici qu'un étudiant ne paie pas au nom d'une autre inscription
            // (et qu'un agent reste dans son université).
            Long inscriptionId;
            try {
                inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            } catch (NumberFormatException | NullPointerException e) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "inscriptionId invalide"));
            }
            if (!securityService.peutAccederInscription(inscriptionId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("erreur", "Accès refusé : droits insuffisants."));
            }
            Paiement p = paiementService.soumettre(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message",    "Paiement soumis avec succès",
                "reference",  p.getReference(),
                "statut",     p.getStatut(),
                "montant",    p.getMontant(),
                "devise",     p.getDevise(),
                "id",         p.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/etudiant/inscription/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    @Operation(summary = "Lister les paiements d'une inscription", description = "Retourne la liste paginée des paiements d'une inscription")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès"),
        @ApiResponse(responseCode = "404", description = "Inscription non trouvée")
    })
    public ResponseEntity<?> mesPaiements(
            @Parameter(description = "ID de l'inscription", required = true)
            @PathVariable Long inscriptionId,
            @Parameter(description = "Numéro de page (0-indexé)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de la page")
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Paiement> paiements = paiementService.paiementsParInscriptionPagines(inscriptionId, pageable);
            return ResponseEntity.ok(Map.of(
                "content", paiements.getContent(),
                "page", paiements.getNumber(),
                "size", paiements.getSize(),
                "totalElements", paiements.getTotalElements(),
                "totalPages", paiements.getTotalPages(),
                "isLast", paiements.isLast(),
                "isFirst", paiements.isFirst()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/etudiant/situation/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    @Operation(summary = "Situation financière d'un étudiant", description = "Retourne le détail des sommes dues et payées")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Situation récupérée avec succès"),
        @ApiResponse(responseCode = "404", description = "Inscription non trouvée")
    })
    public ResponseEntity<?> situationFinanciere(@PathVariable Long inscriptionId) {
        try {
            return ResponseEntity.ok(paiementService.situationFinanciere(inscriptionId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // CAISSE / AGENT
    // ══════════════════════════════════════════

    @GetMapping("/gestion/universite/{uniId}")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Lister les paiements d'une université", description = "Filtrable par statut (?statut=EN_ATTENTE) ou date (?dateJour=aujourd_hui)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès")
    })
    public ResponseEntity<?> tousLesPaiements(
            @Parameter(description = "ID de l'université", required = true)
            @PathVariable Long uniId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String dateJour) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Paiement> paiements;
            if ("EN_ATTENTE".equals(statut)) {
                paiements = paiementService.paiementsEnAttentePagines(uniId, pageable);
            } else if ("aujourd_hui".equals(dateJour)) {
                paiements = paiementService.paiementsDuJourPagines(uniId, pageable);
            } else {
                paiements = paiementService.paiementsParUniversitePagines(uniId, pageable);
            }
            return ResponseEntity.ok(Map.of(
                "content", paiements.getContent(),
                "page", paiements.getNumber(),
                "size", paiements.getSize(),
                "totalElements", paiements.getTotalElements(),
                "totalPages", paiements.getTotalPages()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/rapports/{uniId}/journalier")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Rapport journalier des paiements", description = "Total collecté, répartition par mode de paiement et paiements en attente pour la journée en cours")
    public ResponseEntity<?> rapportJournalier(
            @Parameter(description = "ID de l'université", required = true)
            @PathVariable Long uniId) {
        return ResponseEntity.ok(paiementService.rapportJournalier(uniId));
    }

    @PatchMapping("/gestion/{id}/valider")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Valider un paiement en attente", description = "Valide un paiement précédemment soumis")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Paiement validé"),
        @ApiResponse(responseCode = "400", description = "Paiement déjà validé ou invalide"),
        @ApiResponse(responseCode = "404", description = "Paiement non trouvé")
    })
    public ResponseEntity<?> valider(
            @Parameter(description = "ID du paiement", required = true)
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            Long agentId = (body != null && body.containsKey("agentId"))
                ? Long.valueOf(body.get("agentId").toString()) : null;
            String notes = (body != null) ? (String) body.get("notes") : null;

            Paiement p = paiementService.valider(id, agentId, notes);
            return ResponseEntity.ok(Map.of(
                "message",   "Paiement validé",
                "reference", p.getReference(),
                "statut",    p.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/gestion/{id}/rejeter")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Rejeter un paiement en attente", description = "Rejette un paiement soumis, avec motif")
    public ResponseEntity<?> rejeter(
            @Parameter(description = "ID du paiement", required = true)
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            Long agentId = (body != null && body.containsKey("agentId"))
                ? Long.valueOf(body.get("agentId").toString()) : null;
            String motif = (body != null) ? (String) body.get("motif") : null;

            Paiement p = paiementService.rejeter(id, agentId, motif);
            return ResponseEntity.ok(Map.of(
                "message",   "Paiement rejeté",
                "reference", p.getReference(),
                "statut",    p.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // BARÈMES
    // ══════════════════════════════════════════

    @PostMapping("/baremes")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Créer un barème de paiement", description = "Définit le montant attendu par niveau et type de frais")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Barème créé avec succès"),
        @ApiResponse(responseCode = "400", description = "Données invalides")
    })
    public ResponseEntity<?> creerBareme(@RequestBody Map<String, Object> body) {
        try {
            BaremePaiement b = paiementService.creerBareme(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(b);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}