package cd.genuc.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledPenaliteService {

    private final EcheancierService echeancierService;

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
}