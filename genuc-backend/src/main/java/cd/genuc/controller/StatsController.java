package cd.genuc.controller;

import cd.genuc.repository.InscriptionRepository;
import cd.genuc.repository.PaiementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final InscriptionRepository inscriptionRepository;
    private final PaiementRepository paiementRepository;

    @GetMapping("/inscriptions-par-mois/{annee}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<Integer, Long>> inscriptionsParMois(@PathVariable int annee) {
        List<Map<String, Object>> result = inscriptionRepository.countByMois(annee);
        Map<Integer, Long> data = new HashMap<>();
        for (Map<String, Object> row : result) {
            int mois = ((Number) row.get("mois")).intValue();
            long total = ((Number) row.get("total")).longValue();
            data.put(mois, total);
        }
        IntStream.rangeClosed(1, 12).forEach(m -> data.putIfAbsent(m, 0L));
        return ResponseEntity.ok(data);
    }

    @GetMapping("/paiements-par-mois/{annee}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<Integer, Double>> paiementsParMois(@PathVariable int annee) {
        List<Map<String, Object>> result = paiementRepository.sumByMois(annee);
        Map<Integer, Double> data = new HashMap<>();
        for (Map<String, Object> row : result) {
            int mois = ((Number) row.get("mois")).intValue();
            double total = ((Number) row.get("total")).doubleValue();
            data.put(mois, total);
        }
        IntStream.rangeClosed(1, 12).forEach(m -> data.putIfAbsent(m, 0.0));
        return ResponseEntity.ok(data);
    }
}