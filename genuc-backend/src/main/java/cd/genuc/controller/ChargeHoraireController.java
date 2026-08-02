package cd.genuc.controller;

import cd.genuc.model.ChargeHoraire;
import cd.genuc.repository.ChargeHoraireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/charges-horaires")
@RequiredArgsConstructor
public class ChargeHoraireController {

    private final ChargeHoraireRepository chargeRepo;

    @PostMapping
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> creer(@RequestBody ChargeHoraire charge) {
        try {
            return ResponseEntity.ok(chargeRepo.save(charge));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/personnel/{personnelId}")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<List<ChargeHoraire>> getByPersonnel(@PathVariable Long personnelId) {
        return ResponseEntity.ok(chargeRepo.findByPersonnelId(personnelId));
    }

    @GetMapping("/departement/{departementId}")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<List<ChargeHoraire>> getByDepartement(@PathVariable Long departementId) {
        return ResponseEntity.ok(chargeRepo.findByCoursDepartementId(departementId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> supprimer(@PathVariable Long id) {
        chargeRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Charge horaire supprimée"));
    }
}