package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChefPromotionService {

    private final InscriptionRepository inscriptionRepo;
    private final NoteRepository noteRepo;
    private final PresenceRepository presenceRepo;
    private final PromotionRepository promotionRepo;

    public Map<String, Object> getEffectifs(Long promotionId) {
        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(promotionId);
        long total = inscriptions.size();
        long valides = inscriptions.stream().filter(Inscription::estValidee).count();
        long enAttente = inscriptions.stream().filter(Inscription::estEnAttente).count();

        return Map.of(
                "total", total,
                "valides", valides,
                "enAttente", enAttente
        );
    }

    public Map<String, Object> getResultatsPromotion(Long promotionId, String annee) {
        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(promotionId);
        List<Double> moyennes = inscriptions.stream()
                .map(ins -> noteRepo.calculerMoyenneGenerale(ins.getId(), annee))
                .filter(m -> m != null)
                .collect(Collectors.toList());

        double moyenneGenerale = moyennes.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        long reussis = moyennes.stream().filter(m -> m >= 10).count();
        long total = moyennes.size();

        return Map.of(
                "moyenneGenerale", Math.round(moyenneGenerale * 100.0) / 100.0,
                "tauxReussite", total > 0 ? Math.round((double) reussis / total * 100) : 0,
                "nbEtudiants", total,
                "nbReussis", reussis,
                "nbEchecs", total - reussis
        );
    }

    public Map<String, Object> getPresencesPromotion(Long promotionId) {
        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(promotionId);
        long total = inscriptions.size();

        long presents = inscriptions.stream()
                .map(ins -> presenceRepo.countByEtudiantIdAndDate(ins.getEtudiant().getId(), LocalDate.now()))
                .filter(count -> count > 0)
                .count();

        return Map.of(
                "total", total,
                "presents", presents,
                "absents", total - presents,
                "tauxPresence", total > 0 ? Math.round((double) presents / total * 100) : 0
        );
    }

    public List<Map<String, Object>> getClassementPromotion(Long promotionId, String annee) {
        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(promotionId);
        return inscriptions.stream()
                .map(ins -> {
                    Double moyenne = noteRepo.calculerMoyenneGenerale(ins.getId(), annee);
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("inscriptionId", ins.getId());
                    row.put("etudiant", ins.getEtudiant().getPrenom() + " " + ins.getEtudiant().getNom());
                    row.put("matricule", ins.getEtudiant().getMatriculePermanent());
                    row.put("moyenne", moyenne != null ? moyenne : 0);
                    return row;
                })
                .sorted((a, b) -> Double.compare((Double) b.get("moyenne"), (Double) a.get("moyenne")))
                .collect(Collectors.toList());
    }

    public Promotion getPromotion(Long promotionId) {
        return promotionRepo.findById(promotionId)
                .orElseThrow(() -> new RuntimeException("Promotion introuvable"));
    }
}