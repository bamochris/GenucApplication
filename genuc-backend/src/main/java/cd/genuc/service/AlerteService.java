package cd.genuc.service;

import cd.genuc.model.Alerte;
import cd.genuc.model.Alerte.NiveauAlerte;
import cd.genuc.model.Alerte.CategorieAlerte;
import cd.genuc.repository.AlerteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlerteService {

    private final AlerteRepository alerteRepo;

    @Transactional
    public Alerte creerAlerte(String message, NiveauAlerte niveau, CategorieAlerte categorie, Long universiteId) {
        Alerte alerte = Alerte.builder()
                .message(message)
                .niveau(niveau)
                .categorie(categorie)
                .universiteId(universiteId)
                .vue(false)
                .build();
        return alerteRepo.save(alerte);
    }

    public List<Alerte> getAlertesParUniversite(Long universiteId) {
        return alerteRepo.findByUniversiteIdOrderByCreeLeDesc(universiteId);
    }

    public List<Alerte> getAlertesNonVuesParUniversite(Long universiteId) {
        return alerteRepo.findByUniversiteIdAndVueFalseOrderByCreeLeDesc(universiteId);
    }

    public List<Alerte> getAlertesCritiquesNonVues() {
        return alerteRepo.findByNiveauOrderByCreeLeDesc(NiveauAlerte.CRITICAL);
    }

    public long countNonVues(Long universiteId) {
        return alerteRepo.countByUniversiteIdAndVueFalse(universiteId);
    }

    public long countNonVuesCritiques() {
        return alerteRepo.countNonVuesCritiques();
    }

    @Transactional
    public Alerte marquerVue(Long alerteId) {
        Alerte alerte = alerteRepo.findById(alerteId)
                .orElseThrow(() -> new RuntimeException("Alerte introuvable"));
        alerte.setVue(true);
        return alerteRepo.save(alerte);
    }

    @Transactional
    public void marquerToutesVues(Long universiteId) {
        List<Alerte> nonVues = alerteRepo.findByUniversiteIdAndVueFalseOrderByCreeLeDesc(universiteId);
        for (Alerte a : nonVues) {
            a.setVue(true);
        }
        alerteRepo.saveAll(nonVues);
    }

    /**
     * Vérification automatique et création d'alertes
     * À appeler périodiquement (via @Scheduled)
     */
    @Transactional
    public void verifierEtCreerAlertes(Long universiteId) {
        // Exemple : alerte si plus de 10 inscriptions en attente
        // (la logique réelle sera implémentée avec les services appropriés)
        // Cette méthode peut être appelée par un scheduler
    }
}