package cd.genuc.controller;

import cd.genuc.model.Filiere;
import cd.genuc.model.Promotion;
import cd.genuc.repository.FiliereRepository;
import cd.genuc.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StructureAcademiqueController {

    private final FiliereRepository filiereRepository;
    private final PromotionRepository promotionRepository;

    @GetMapping("/filieres/public/{filiereId}/promotions")
    public ResponseEntity<List<Promotion>> getPromotionsParFiliere(
            @PathVariable Long filiereId,
            @RequestParam Long anneeAcademiqueId) {
        
        List<Promotion> promotions = promotionRepository
                .findByFiliereIdAndAnneeAcademiqueId(filiereId, anneeAcademiqueId);
        return ResponseEntity.ok(promotions);
    }
}