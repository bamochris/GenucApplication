package cd.genuc.controller;

import cd.genuc.service.TfcService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Petit contrôleur dédié à l'endpoint "étudiants disponibles pour encadrement TFC/Mémoire"
 * utilisé par la page professeur Encadrements.jsx. Isolé dans son propre fichier pour
 * éviter tout conflit avec un futur ProfesseurController plus large (dashboard, cours...).
 */
@RestController
@RequestMapping("/api/professeur/etudiants")
@RequiredArgsConstructor
public class ProfesseurEtudiantsController {

    private final TfcService tfcService;

    @GetMapping("/disponibles/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ENSEIGNANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> etudiantsDisponibles(@PathVariable Long professeurId) {
        return ResponseEntity.ok(tfcService.etudiantsDisponibles(professeurId));
    }
}
