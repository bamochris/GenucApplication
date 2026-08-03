package cd.genuc.controller;

import cd.genuc.dto.LettreAcceptationDTO;
import cd.genuc.service.LettreAcceptationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 📄 API REST — Lettre d'Acceptation
 * <p>
 * Gestion des lettres d'acceptation officielles avec en-tête MINESU (RDC)
 * pour les étudiants inscrits aux vacations Jour/Soir.
 * <p>
 * Routes préfixées : /api/lettres-acceptation
 */
@RestController
@RequestMapping("/api/lettres-acceptation")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Lettres d'Acceptation", description = "Génération et gestion des lettres d'acceptation officielles MINESU RDC")
public class LettreAcceptationController {

    private final LettreAcceptationService lettreService;

    // ════════════════════════════════════════════════════════════════════
    //  CRUD
    // ════════════════════════════════════════════════════════════════════

    @Operation(summary = "Générer une lettre d'acceptation",
            description = "Crée une lettre d'acceptation pour une inscription vacation validée")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lettre générée avec succès"),
            @ApiResponse(responseCode = "400", description = "Inscription non validée ou lettre déjà existante"),
            @ApiResponse(responseCode = "404", description = "Inscription vacation introuvable")
    })
    @PostMapping("/generer/{inscriptionVacationId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<LettreAcceptationDTO> genererLettre(
            @Parameter(description = "ID de l'inscription vacation") 
            @PathVariable Long inscriptionVacationId) throws Exception {
        log.info("📄 Demande de génération de lettre pour inscription vacation: {}", inscriptionVacationId);
        LettreAcceptationDTO dto = lettreService.genererLettre(inscriptionVacationId);
        return ResponseEntity.ok(dto);
    }

    @Operation(summary = "Obtenir une lettre par son ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE', 'ETUDIANT')")
    public ResponseEntity<LettreAcceptationDTO> getLettre(@PathVariable Long id) {
        return ResponseEntity.ok(lettreService.getLettre(id));
    }

    @Operation(summary = "Lister les lettres d'un étudiant")
    @GetMapping("/etudiant/{etudiantId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE', 'ETUDIANT')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<List<LettreAcceptationDTO>> getLettresByEtudiant(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(lettreService.getLettresByEtudiant(etudiantId));
    }

    @Operation(summary = "Lister les lettres d'une université")
    @GetMapping("/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<List<LettreAcceptationDTO>> getLettresByUniversite(@PathVariable Long universiteId) {
        return ResponseEntity.ok(lettreService.getLettresByUniversite(universiteId));
    }

    @Operation(summary = "Lister les lettres d'une vacation")
    @GetMapping("/vacation/{vacationId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<List<LettreAcceptationDTO>> getLettresByVacation(@PathVariable Long vacationId) {
        return ResponseEntity.ok(lettreService.getLettresByVacation(vacationId));
    }

    @Operation(summary = "Obtenir la lettre associée à une inscription vacation")
    @GetMapping("/inscription-vacation/{inscriptionVacationId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE', 'ETUDIANT')")
    public ResponseEntity<LettreAcceptationDTO> getLettreByInscriptionVacation(
            @PathVariable Long inscriptionVacationId) {
        return ResponseEntity.ok(lettreService.getLettreByInscriptionVacation(inscriptionVacationId));
    }

    // ════════════════════════════════════════════════════════════════════
    //  ÉMISSION / TÉLÉCHARGEMENT PDF
    // ════════════════════════════════════════════════════════════════════

    @Operation(summary = "Émettre et télécharger le PDF de la lettre d'acceptation",
            description = "Génère le PDF officiel avec en-tête MINESU RDC, QR Code, et marque la lettre comme émise")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "PDF généré avec succès"),
            @ApiResponse(responseCode = "404", description = "Lettre introuvable")
    })
    @PostMapping("/emettre/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<ByteArrayResource> emettreLettrePdf(
            @PathVariable Long id,
            @RequestParam(required = false) Long signataireId) throws Exception {
        byte[] pdfBytes = lettreService.emettreLettrePdf(id, signataireId);
        LettreAcceptationDTO dto = lettreService.getLettre(id);

        ByteArrayResource resource = new ByteArrayResource(pdfBytes);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"lettre_acceptation_" + dto.getNumeroLettre() + ".pdf\"")
                .body(resource);
    }

    @Operation(summary = "Télécharger le PDF d'une lettre déjà émise")
    @GetMapping("/telecharger/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE', 'ETUDIANT')")
    public ResponseEntity<ByteArrayResource> telechargerLettrePdf(@PathVariable Long id) throws Exception {
        // Récupérer la lettre et regénérer le PDF (sans changer le statut)
        LettreAcceptationDTO dto = lettreService.getLettre(id);
        
        // Le service génère le PDF de la lettre déjà émise
        // Note: on utilise le service pour obtenir les bytes
        byte[] pdfBytes = lettreService.emettreLettrePdf(id);

        ByteArrayResource resource = new ByteArrayResource(pdfBytes);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"lettre_acceptation_" + dto.getNumeroLettre() + ".pdf\"")
                .body(resource);
    }

    // ════════════════════════════════════════════════════════════════════
    //  ENVOI PAR EMAIL
    // ════════════════════════════════════════════════════════════════════

    @Operation(summary = "Envoyer la lettre par email à l'étudiant")
    @PostMapping("/envoyer-email/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<Map<String, String>> envoyerParEmail(@PathVariable Long id) throws Exception {
        lettreService.envoyerLettreParEmail(id);
        return ResponseEntity.ok(Map.of("message", "Lettre envoyée par email avec succès"));
    }

    // ════════════════════════════════════════════════════════════════════
    //  VÉRIFICATION PUBLIQUE
    // ════════════════════════════════════════════════════════════════════

    @Operation(summary = "Vérifier l'authenticité d'une lettre d'acceptation (publique)",
            description = "Endpoint public permettant de vérifier une lettre via son UUID (QR Code)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lettre valide"),
            @ApiResponse(responseCode = "404", description = "Lettre introuvable")
    })
    @GetMapping("/verifier/{uuid}")
    public ResponseEntity<LettreAcceptationDTO> verifierLettre(
            @Parameter(description = "UUID de vérification (présent dans le QR Code)")
            @PathVariable String uuid) {
        return ResponseEntity.ok(lettreService.verifierLettre(uuid));
    }
}
