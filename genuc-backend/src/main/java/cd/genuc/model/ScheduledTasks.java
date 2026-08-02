package cd.genuc.model;
import cd.genuc.service.EcheancierService;
import cd.genuc.service.PalmaresService;
import cd.genuc.service.ScheduledAlerteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Regroupement de toutes les tâches planifiées.
 * Peut être désactivé via la propriété : scheduling.enabled=false
 */
@Slf4j
@RequiredArgsConstructor
// Désactivé : chaque service (@ScheduledAlerteService, EcheancierService, PalmaresService)
// possède déjà ses propres @Scheduled — ce wrapper causerait une double exécution.
public class ScheduledTasks {

    private final ScheduledAlerteService alerteService;
    private final EcheancierService echeancierService;
    private final PalmaresService palmaresService;

    /**
     * Vérification quotidienne des alertes à 8h00
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void verifierAlertes() {
        log.info("Début de la vérification automatique des alertes...");
        try {
            alerteService.verifierAlertes();
            log.info("Vérification automatique des alertes terminée.");
        } catch (Exception e) {
            log.error("Erreur lors de la vérification automatique des alertes : {}", e.getMessage(), e);
        }
    }

    /**
     * Calcul des pénalités chaque nuit à minuit
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void calculerPenalites() {
        log.info("Début du calcul automatique des pénalités...");
        try {
            echeancierService.calculerPenalites();
            log.info("Calcul des pénalités terminé avec succès");
        } catch (Exception e) {
            log.error("Erreur lors du calcul des pénalités: {}", e.getMessage());
        }
    }

    /**
     * Génération automatique du palmarès à 2h00 du matin
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void genererPalmares() {
        log.info("Début de la génération automatique du palmarès...");
        try {
            palmaresService.genererPalmaresAutomatique();
            log.info("Génération automatique du palmarès terminée.");
        } catch (Exception e) {
            log.error("Erreur lors de la génération automatique du palmarès : {}", e.getMessage(), e);
        }
    }
}