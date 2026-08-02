package cd.genuc.controller;

import cd.genuc.model.Caisse;
import cd.genuc.model.Caisse.StatutCaisse;
import cd.genuc.model.Universite;
import cd.genuc.repository.CaisseRepository;
import cd.genuc.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/caisse")
@RequiredArgsConstructor
public class CaisseController {

    private final CaisseRepository caisseRepo;
    private final UniversiteRepository universiteRepo;

    @PostMapping("/ouvrir")
    @PreAuthorize("hasRole('CAISSIER')")
    public ResponseEntity<?> ouvrirCaisse(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("universiteId") || !body.containsKey("caissierId") || !body.containsKey("soldeInitial")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "universiteId, caissierId et soldeInitial sont requis"));
            }
            Long universiteId = Long.valueOf(body.get("universiteId").toString());
            Long caissierId = Long.valueOf(body.get("caissierId").toString());
            Double soldeInitial = Double.valueOf(body.get("soldeInitial").toString());

            // Vérifier si une caisse est déjà ouverte
            if (caisseRepo.findByUniversiteIdAndStatut(universiteId, StatutCaisse.OUVERTE).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Une caisse est déjà ouverte pour cette université"));
            }

            Universite universite = universiteRepo.findById(universiteId)
                    .orElseThrow(() -> new RuntimeException("Université introuvable"));

            Caisse caisse = Caisse.builder()
                    .universite(universite)
                    .ouverteParId(caissierId)
                    .soldeInitial(soldeInitial)
                    .statut(StatutCaisse.OUVERTE)
                    .build();

            return ResponseEntity.ok(caisseRepo.save(caisse));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/fermer")
    @PreAuthorize("hasRole('CAISSIER')")
    public ResponseEntity<?> fermerCaisse(@PathVariable Long id,
                                          @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("caissierId") || !body.containsKey("soldeFinal")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "caissierId et soldeFinal sont requis"));
            }
            Long caissierId = Long.valueOf(body.get("caissierId").toString());
            Double soldeFinal = Double.valueOf(body.get("soldeFinal").toString());
            String commentaire = body.containsKey("commentaire") ? (String) body.get("commentaire") : null;

            Caisse caisse = caisseRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Caisse introuvable"));

            if (caisse.getStatut() == StatutCaisse.FERMEE) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Cette caisse est déjà fermée"));
            }

            caisse.setStatut(StatutCaisse.FERMEE);
            caisse.setFermeeParId(caissierId);
            caisse.setDateFermeture(LocalDate.now());
            caisse.setSoldeFinal(soldeFinal);
            if (commentaire != null) caisse.setCommentaire(commentaire);

            return ResponseEntity.ok(caisseRepo.save(caisse));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Caisse>> getHistorique(@PathVariable Long universiteId) {
        return ResponseEntity.ok(caisseRepo.findByUniversiteIdOrderByDateOuvertureDesc(universiteId));
    }

    @GetMapping("/universite/{universiteId}/ouverte")
    @PreAuthorize("hasRole('CAISSIER')")
    public ResponseEntity<?> getCaisseOuverte(@PathVariable Long universiteId) {
        return caisseRepo.findByUniversiteIdAndStatut(universiteId, StatutCaisse.OUVERTE)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats/{universiteId}")
    @PreAuthorize("hasAnyRole('CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getStats(@PathVariable Long universiteId) {
        List<Caisse> historiques = caisseRepo.findByUniversiteIdOrderByDateOuvertureDesc(universiteId);
        long totalOuvertures = historiques.size();
        double moyenneSolde = historiques.stream()
                .filter(c -> c.getStatut() == StatutCaisse.FERMEE)
                .mapToDouble(Caisse::getSoldeFinal)
                .average()
                .orElse(0.0);

        return ResponseEntity.ok(Map.of(
                "totalOuvertures", totalOuvertures,
                "moyenneSoldeFinal", Math.round(moyenneSolde * 100.0) / 100.0,
                "caisseActuellementOuverte", caisseRepo.findByUniversiteIdAndStatut(universiteId, StatutCaisse.OUVERTE).isPresent()
        ));
    }
}