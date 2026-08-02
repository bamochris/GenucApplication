package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.TransactionRepository;
import cd.genuc.repository.TransactionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentOrchestratorService {

    private final TransactionRepository transactionRepository;
    private final TransactionLogRepository transactionLogRepository;
    private final PaymentProviderService paymentProviderService;
    private final ExchangeRateService exchangeRateService;

    @Transactional
    public Transaction initierPaiement(
            Etudiant etudiant,
            Universite universite,
            BigDecimal montantFC,
            PaymentMethodEnum method,
            String description
    ) {
        log.info("Initiation paiement - étudiant: {}, université: {}, montant: {} FC, méthode: {}",
                etudiant.getId(), universite.getId(), montantFC, method);

        // 1. Créer la transaction
        Transaction transaction = Transaction.builder()
                .transactionCode(genererCode())
                .transactionType("PAYMENT")
                .student(etudiant)
                .universite(universite)
                .amountFc(montantFC)
                .amountUsd(exchangeRateService.convertFcToUsd(montantFC))
                .currencyUsed("FC")
                .exchangeRateUsed(exchangeRateService.getCurrentExchangeRate())
                .paymentMethod(method)
                .paymentStatus(PaymentStatusEnum.PENDING)
                .transactionStatus(TransactionStatusEnum.INITIATED)
                .description(description != null ? description : "Paiement via " + method.name())
                .initiatedAt(LocalDateTime.now())
                .build();

        transaction = transactionRepository.save(transaction);
        log.info("Transaction créée : {}", transaction.getTransactionCode());

        creerLog(transaction, null, TransactionStatusEnum.PROCESSING, "Traitement initié");

        // 2. Traiter via le provider
        try {
            transaction.setTransactionStatus(TransactionStatusEnum.PROCESSING);
            transaction = transactionRepository.save(transaction);

            String providerResponse = paymentProviderService.processTransaction(transaction);
            transaction.setProviderTransactionId(providerResponse);
            transaction.setPaymentStatus(PaymentStatusEnum.CONFIRMED);
            transaction.setTransactionStatus(TransactionStatusEnum.CONFIRMED);
            transaction.setCompletedAt(LocalDateTime.now());
            transaction.setConfirmedAt(LocalDateTime.now());

            creerLog(transaction, TransactionStatusEnum.PROCESSING, TransactionStatusEnum.CONFIRMED,
                    "Paiement confirmé par le provider");

            log.info("Transaction {} confirmée avec succès", transaction.getTransactionCode());

        } catch (Exception e) {
            log.error("Erreur lors du traitement du paiement : {}", e.getMessage(), e);
            transaction.setPaymentStatus(PaymentStatusEnum.FAILED);
            transaction.setTransactionStatus(TransactionStatusEnum.FAILED);
            transaction.setNotes("Erreur : " + e.getMessage());

            creerLog(transaction, TransactionStatusEnum.PROCESSING, TransactionStatusEnum.FAILED,
                    "Échec du traitement : " + e.getMessage());
        }

        return transactionRepository.save(transaction);
    }

    @Transactional(readOnly = true)
    public Transaction getTransactionStatus(String transactionCode) {
        return transactionRepository.findByTransactionCode(transactionCode)
                .orElseThrow(() -> new RuntimeException("Transaction introuvable"));
    }

    @Transactional
    public Transaction annulerTransaction(Long transactionId) {
        Transaction t = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction introuvable"));

        if (t.getPaymentStatus() != PaymentStatusEnum.PENDING &&
            t.getPaymentStatus() != PaymentStatusEnum.PROCESSING) {
            throw new IllegalStateException("Impossible d'annuler une transaction déjà traitée (statut: " +
                    t.getPaymentStatus() + ")");
        }

        t.setPaymentStatus(PaymentStatusEnum.CANCELLED);
        t.setTransactionStatus(TransactionStatusEnum.CANCELLED);
        t.setCompletedAt(LocalDateTime.now());

        creerLog(t, t.getTransactionStatus(), TransactionStatusEnum.CANCELLED, "Transaction annulée par l'utilisateur");

        log.info("Transaction {} annulée avec succès", t.getTransactionCode());
        return transactionRepository.save(t);
    }

    // ─── Utilitaires privés ──────────────────────────────────────

    private String genererCode() {
        return "TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    }

    private void creerLog(Transaction transaction, TransactionStatusEnum from, TransactionStatusEnum to, String message) {
        try {
            TransactionLog log = TransactionLog.builder()
                    .transaction(transaction)
                    .statusFrom(from)
                    .statusTo(to)
                    .message(message)
                    .build();
            transactionLogRepository.save(log);
        } catch (Exception e) {
            log.warn("Impossible de créer un log pour la transaction {} : {}", transaction.getId(), e.getMessage());
        }
    }
}