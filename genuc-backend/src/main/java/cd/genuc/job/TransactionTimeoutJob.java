package cd.genuc.job;

import cd.genuc.model.PaymentStatusEnum;
import cd.genuc.model.Transaction;
import cd.genuc.model.TransactionStatusEnum;
import cd.genuc.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionTimeoutJob {

    private final TransactionRepository transactionRepository;

    @Scheduled(fixedDelay = 60000) // Toutes les 60 secondes
    @Transactional
    public void verifierTransactionsTimeout() {
        LocalDateTime timeoutThreshold = LocalDateTime.now().minusMinutes(5);

        List<Transaction> transactionsEnAttente = transactionRepository
                .findByPaymentStatusAndInitiatedAtBefore(PaymentStatusEnum.PENDING, timeoutThreshold);

        if (transactionsEnAttente.isEmpty()) {
            return;
        }

        log.info("{} transactions en attente depuis plus de 5 minutes détectées", transactionsEnAttente.size());

        for (Transaction t : transactionsEnAttente) {
            if (t.getTransactionStatus() == TransactionStatusEnum.PROCESSING) {
                continue;
            }

            // UPDATE conditionnel : n'écrit que si le statut est TOUJOURS PENDING en base au
            // moment de l'écriture — évite d'écraser un callback webhook arrivé entre le fetch
            // et le save (risque réel avec plusieurs instances backend en parallèle).
            int lignesModifiees = transactionRepository.expirerSiToujoursEnAttente(
                    t.getId(),
                    PaymentStatusEnum.PENDING,
                    PaymentStatusEnum.FAILED,
                    TransactionStatusEnum.EXPIRED,
                    "Transaction expirée : aucun callback reçu dans le délai imparti",
                    LocalDateTime.now());

            if (lignesModifiees > 0) {
                log.info("Transaction {} expirée", t.getTransactionCode());
            } else {
                log.debug("Transaction {} déjà mise à jour entre-temps (callback reçu) — ignorée", t.getTransactionCode());
            }
        }
    }

    @Scheduled(fixedDelay = 120000) // Toutes les 2 minutes
    @Transactional
    public void verifierTransactionsBloquees() {
        LocalDateTime processingThreshold = LocalDateTime.now().minusMinutes(10);

        List<Transaction> transactionsBloquees = transactionRepository
                .findByTransactionStatusAndInitiatedAtBefore(TransactionStatusEnum.PROCESSING, processingThreshold);

        if (transactionsBloquees.isEmpty()) {
            return;
        }

        log.info("{} transactions bloquées en traitement depuis plus de 10 minutes détectées", transactionsBloquees.size());

        for (Transaction t : transactionsBloquees) {
            int lignesModifiees = transactionRepository.echouerSiToujoursEnTraitement(
                    t.getId(),
                    TransactionStatusEnum.PROCESSING,
                    PaymentStatusEnum.FAILED,
                    TransactionStatusEnum.FAILED,
                    "Transaction bloquée : temps de traitement dépassé",
                    LocalDateTime.now());

            if (lignesModifiees > 0) {
                log.info("Transaction {} marquée comme échouée (timeout traitement)", t.getTransactionCode());
            } else {
                log.debug("Transaction {} déjà mise à jour entre-temps — ignorée", t.getTransactionCode());
            }
        }
    }
}