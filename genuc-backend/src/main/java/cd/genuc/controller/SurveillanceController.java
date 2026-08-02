package cd.genuc.controller;

import cd.genuc.model.Surveillance;
import cd.genuc.repository.SurveillanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/surveillances")
@RequiredArgsConstructor
public class SurveillanceController {

    private final SurveillanceRepository surveillanceRepo;

    @PostMapping
    @PreAuthorize("hasAnyRole('APPARITEUR', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> creer(@RequestBody Surveillance surveillance) {
        try {
            return ResponseEntity.ok(surveillanceRepo.save(surveillance));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/examen/{examenId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Surveillance>> getByExamen(@PathVariable Long examenId) {
        return ResponseEntity.ok(surveillanceRepo.findByExamenId(examenId));
    }

    @GetMapping("/surveillant/{surveillantId}")
    @PreAuthorize("hasAnyRole('APPARITEUR', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<List<Surveillance>> getBySurveillant(@PathVariable Long surveillantId) {
        return ResponseEntity.ok(surveillanceRepo.findBySurveillantId(surveillantId));
    }
}