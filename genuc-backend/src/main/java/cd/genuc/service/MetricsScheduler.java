package cd.genuc.service;

import cd.genuc.model.Paiement.StatutPaiement;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.repository.PaiementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Rafraîchit les jauges Prometheus toutes les 60 secondes.
 * Utilise des requêtes COUNT légères en lecture seule → replica.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MetricsScheduler {

    private final MetricsService metricsService;
    private final PaiementRepository paiementRepository;
    private final InscriptionRepository inscriptionRepository;

    @Scheduled(fixedDelay = 60_000)
    @Transactional(readOnly = true)
    public void rafraichirJauges() {
        try {
            long enAttente = paiementRepository.countByStatut(StatutPaiement.EN_ATTENTE);
            metricsService.mettreAJourPaiementsEnAttente(enAttente);

            long actifs = inscriptionRepository.count();
            metricsService.mettreAJourEtudiantsActifs(actifs);

        } catch (Exception e) {
            log.warn("Erreur rafraîchissement jauges métriques : {}", e.getMessage());
        }
    }
}
