package cd.genuc.service;

import cd.genuc.model.Alerte;
import cd.genuc.model.Alerte.NiveauAlerte;
import cd.genuc.model.Paiement;
import cd.genuc.model.Alerte.CategorieAlerte;
import cd.genuc.model.StatutInscription;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.repository.PaiementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledAlerteService {

    private final AlerteService alerteService;
    private final InscriptionRepository inscriptionRepo;
    private final PaiementRepository paiementRepo;

    @Scheduled(cron = "0 0 8 * * *")
    public void verifierAlertes() {
        log.info("Début de la vérification automatique des alertes...");
        try {
            long totalEnAttente = inscriptionRepo.countByStatut(StatutInscription.EN_ATTENTE);
            if (totalEnAttente > 50) {
                alerteService.creerAlerte(
                        "⚠️ Plus de 50 inscriptions en attente (" + totalEnAttente + ")",
                        NiveauAlerte.WARNING,
                        CategorieAlerte.INSCRIPTION,
                        null
                );
                log.warn("Alerte créée : inscriptions en attente > 50");
            }

            long paiementsEnAttente = paiementRepo.countByStatut(Paiement.StatutPaiement.EN_ATTENTE);
            if (paiementsEnAttente > 20) {
                alerteService.creerAlerte(
                        "⚠️ Plus de 20 paiements en attente de validation (" + paiementsEnAttente + ")",
                        NiveauAlerte.WARNING,
                        CategorieAlerte.PAIEMENT,
                        null
                );
                log.warn("Alerte créée : paiements en attente > 20");
            }

            log.info("Vérification automatique des alertes terminée.");

        } catch (Exception e) {
            log.error("Erreur lors de la vérification automatique des alertes : {}", e.getMessage(), e);
        }
    }
}