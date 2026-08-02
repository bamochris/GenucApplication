package cd.genuc.controller;

import cd.genuc.model.Filiere;
import cd.genuc.service.FiliereService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/filieres/public")
@RequiredArgsConstructor
@Tag(name = "Filières publiques", description = "Consultation publique des filières")
public class FilierePublicController {

    private final FiliereService filiereService;

    @GetMapping("/{id}/details")
    @Operation(summary = "Obtenir les détails complets d'une filière (durée, frais, débouchés, conditions)")
    public ResponseEntity<?> getFiliereDetails(@PathVariable Long id) {
        try {
            Filiere filiere = filiereService.getFiliere(id);
            
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("id", filiere.getId());
            details.put("nom", filiere.getNom());
            details.put("code", filiere.getCode());
            details.put("description", filiere.getDescription());
            details.put("niveau", filiere.getNiveau() != null ? filiere.getNiveau().name() : "LICENCE");
            details.put("dureeAnnees", filiere.getDureeAnnees());
            details.put("creditsTotal", filiere.getCreditsTotal());
            
            // ✅ Détails enrichis (Phase 2)
            details.put("fraisAnnee1", filiere.getFraisAnnee1());
            details.put("fraisAnnee2", filiere.getFraisAnnee2());
            details.put("fraisAnnee3", filiere.getFraisAnnee3());
            details.put("deviseFrais", filiere.getDeviseFrais());
            details.put("debouches", filiere.getDebouches() != null 
                ? filiere.getDebouches().split("\n") : new String[0]);
            details.put("conditionsAdmission", filiere.getConditionsAdmission());
            details.put("programmeResume", filiere.getProgrammeResume());
            details.put("inscriptionsOuvertes", filiere.isInscriptionsOuvertes());
            
            // Informations sur le département
            if (filiere.getDepartement() != null) {
                Map<String, Object> dept = new LinkedHashMap<>();
                dept.put("id", filiere.getDepartement().getId());
                dept.put("nom", filiere.getDepartement().getNom());
                dept.put("code", filiere.getDepartement().getCode());
                details.put("departement", dept);
            }
            
            return ResponseEntity.ok(details);
            
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}