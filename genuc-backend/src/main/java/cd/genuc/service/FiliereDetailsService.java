package cd.genuc.service;

import cd.genuc.model.Filiere;
import cd.genuc.config.cache.CacheNames;
import cd.genuc.repository.FiliereRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FiliereDetailsService {

    private final FiliereRepository filiereRepo;

    @Cacheable(value = CacheNames.FILIERE_DETAILS, key = "#id")
    public Map<String, Object> getFiliereDetails(Long id) {
        Filiere filiere = filiereRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Filière introuvable"));

        Map<String, Object> details = new HashMap<>();
        details.put("id", filiere.getId());
        details.put("nom", filiere.getNom());
        details.put("code", filiere.getCode());
        details.put("description", filiere.getDescription());
        details.put("niveau", filiere.getNiveau() != null ? filiere.getNiveau().name() : "LICENCE");
        details.put("dureeAnnees", filiere.getDureeAnnees());
        details.put("creditsTotal", filiere.getCreditsTotal());

        // Frais par année
        Map<String, Double> fraisParAnnee = new HashMap<>();
        fraisParAnnee.put("annee1", filiere.getFraisAnnee1() != null ? filiere.getFraisAnnee1() : 0.0);
        fraisParAnnee.put("annee2", filiere.getFraisAnnee2() != null ? filiere.getFraisAnnee2() : 0.0);
        fraisParAnnee.put("annee3", filiere.getFraisAnnee3() != null ? filiere.getFraisAnnee3() : 0.0);
        details.put("fraisParAnnee", fraisParAnnee);
        details.put("deviseFrais", filiere.getDeviseFrais());

        // Débouchés (splittés)
        if (filiere.getDebouches() != null && !filiere.getDebouches().isEmpty()) {
            details.put("debouches", filiere.getDebouches().split("\\n"));
        } else {
            details.put("debouches", new String[]{});
        }

        // Conditions d'admission
        if (filiere.getConditionsAdmission() != null && !filiere.getConditionsAdmission().isEmpty()) {
            details.put("conditionsAdmission", filiere.getConditionsAdmission().split("\\n"));
        } else {
            details.put("conditionsAdmission", new String[]{});
        }

        details.put("programmeResume", filiere.getProgrammeResume());
        details.put("inscriptionsOuvertes", filiere.isInscriptionsOuvertes());
        details.put("actif", filiere.isActif());

        return details;
    }
}