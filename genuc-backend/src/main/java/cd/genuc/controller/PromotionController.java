package cd.genuc.controller;

import cd.genuc.model.Promotion;
import cd.genuc.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionRepository promotionRepository;

    // Récupérer toutes les promotions d'une université (via la filière -> département -> université)
    @GetMapping("/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Promotion>> getByUniversiteId(@PathVariable Long universiteId) {
        List<Promotion> promotions = promotionRepository.findByFiliereDepartementUniversiteId(universiteId);
        return ResponseEntity.ok(promotions);
    }

    // Récupérer toutes les promotions d'une filière
    @GetMapping("/filiere/{filiereId}")
    public ResponseEntity<List<Promotion>> getByFiliere(@PathVariable Long filiereId) {
        List<Promotion> promotions = promotionRepository.findByFiliereId(filiereId);
        return ResponseEntity.ok(promotions);
    }

    // Récupérer une promotion par son ID
    @GetMapping("/{id}")
    public ResponseEntity<Promotion> getById(@PathVariable Long id) {
        return promotionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Créer une nouvelle promotion (admin seulement)
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> create(@RequestBody Promotion promotion) {
        try {
            if (promotion.getFiliere() == null || promotion.getFiliere().getId() == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Filière requise"));
            }
            Promotion saved = promotionRepository.save(promotion);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // Mettre à jour une promotion
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Promotion promotion) {
        try {
            if (!promotionRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            promotion.setId(id);
            Promotion updated = promotionRepository.save(promotion);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // Supprimer une promotion (soft delete ou suppression réelle)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            if (!promotionRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            promotionRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Promotion supprimée"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}