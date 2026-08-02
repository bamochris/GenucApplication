package cd.genuc.controller;

import cd.genuc.dto.InscriptionPubliqueRequest;
import cd.genuc.model.DossierInscription;
import cd.genuc.service.InscriptionPubliqueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/inscriptions/international")
@RequiredArgsConstructor
@Tag(name = "Inscriptions internationales", description = "Inscription des étudiants étrangers")
public class InscriptionInternationaleController {

    private final InscriptionPubliqueService inscriptionPubliqueService;

    @PostMapping
    @Operation(summary = "Soumettre une demande d'inscription pour un étudiant étranger")
    public ResponseEntity<?> inscrireInternational(@Valid @RequestBody InscriptionPubliqueRequest request) {
        try {
            // ✅ Vérification des champs spécifiques aux internationaux
            if (request.getResidentEtranger() != null && request.getResidentEtranger()) {
                if (request.getPaysResidence() == null || request.getPaysResidence().isBlank()) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("erreur", "Le pays de résidence est obligatoire pour les étudiants étrangers"));
                }
                if (request.getTypePieceIdentite() == null || request.getTypePieceIdentite().isBlank()) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("erreur", "Le type de pièce d'identité est obligatoire"));
                }
                if (request.getNumeroPieceIdentite() == null || request.getNumeroPieceIdentite().isBlank()) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("erreur", "Le numéro de pièce d'identité est obligatoire"));
                }
            }

            // ✅ Soumission du dossier (le service enregistre les champs internationaux)
            DossierInscription dossier = inscriptionPubliqueService.soumettreDossierComplet(request);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Dossier d'inscription internationale soumis avec succès",
                "numeroDossier", dossier.getNumeroDossier(),
                "id", dossier.getId(),
                "statut", dossier.getStatut().name(),
                "email", dossier.getEmail()
            ));
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/verifier/{numeroDossier}")
    @Operation(summary = "Vérifier le statut d'un dossier international")
    public ResponseEntity<?> verifierStatut(@PathVariable String numeroDossier) {
        try {
            DossierInscription dossier = inscriptionPubliqueService.getDossierByNumero(numeroDossier);
            return ResponseEntity.ok(Map.of(
                "numeroDossier", dossier.getNumeroDossier(),
                "statut", dossier.getStatut().name(),
                "dateSoumission", dossier.getCreeLe(),
                "nom", dossier.getPrenom() + " " + dossier.getNom(),
                "residentEtranger", dossier.getResidentEtranger(),
                "paysOrigine", dossier.getPaysOrigine()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("erreur", "Dossier non trouvé"));
        }
    }
}