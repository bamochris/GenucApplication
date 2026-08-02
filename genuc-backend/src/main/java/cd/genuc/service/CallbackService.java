package cd.genuc.service;

import cd.genuc.dto.callback.*;
import cd.genuc.model.PaymentStatusEnum;
import cd.genuc.model.Transaction;
import cd.genuc.model.TransactionLog;
import cd.genuc.model.TransactionStatusEnum;
import cd.genuc.repository.TransactionLogRepository;
import cd.genuc.repository.TransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CallbackService {

    private final TransactionRepository transactionRepository;
    private final TransactionLogRepository transactionLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Traite un callback de Vodacom M-Pesa.
     */
    @Transactional
    public boolean traiterCallbackVodacom(VodacomCallbackPayload payload) {
        log.info("Traitement du callback Vodacom : {}", payload);

        Transaction transaction = transactionRepository.findByTransactionCode(payload.getTransactionCode())
                .orElseThrow(() -> {
                    log.error("Transaction non trouvée pour le code : {}", payload.getTransactionCode());
                    return new RuntimeException("Transaction non trouvée");
                });

        return traiterCallbackGenerique(transaction, payload, "Vodacom");
    }

    /**
     * Traite un callback d'Airtel Money.
     */
    @Transactional
    public boolean traiterCallbackAirtel(AirtelCallbackPayload payload) {
        log.info("Traitement du callback Airtel : {}", payload);

        Transaction transaction = transactionRepository.findByTransactionCode(payload.getTransactionCode())
                .orElseThrow(() -> {
                    log.error("Transaction non trouvée pour le code : {}", payload.getTransactionCode());
                    return new RuntimeException("Transaction non trouvée");
                });

        return traiterCallbackGenerique(transaction, payload, "Airtel");
    }

    /**
     * Traite un callback d'Orange Money.
     */
    @Transactional
    public boolean traiterCallbackOrange(OrangeCallbackPayload payload) {
        log.info("Traitement du callback Orange : {}", payload);

        Transaction transaction = transactionRepository.findByTransactionCode(payload.getTransactionCode())
                .orElseThrow(() -> {
                    log.error("Transaction non trouvée pour le code : {}", payload.getTransactionCode());
                    return new RuntimeException("Transaction non trouvée");
                });

        return traiterCallbackGenerique(transaction, payload, "Orange");
    }

    /**
     * Traite un callback générique (méthode centralisée).
     */
    private boolean traiterCallbackGenerique(Transaction transaction, Object payload, String provider) {
        try {
            // Vérifier si la transaction est déjà confirmée
            if (transaction.getPaymentStatus() == PaymentStatusEnum.CONFIRMED) {
                log.warn("Transaction {} déjà confirmée, callback ignoré", transaction.getTransactionCode());
                return true; // Ignorer le callback pour une transaction déjà confirmée
            }

            // Déterminer le statut à partir du payload
            String status = extraireStatut(payload);
            PaymentStatusEnum nouveauStatut = mapStatutProvider(status);
            TransactionStatusEnum nouveauStatutTransaction = mapTransactionStatut(status);

            // Mettre à jour la transaction
            transaction.setPaymentStatus(nouveauStatut);
            transaction.setTransactionStatus(nouveauStatutTransaction);
            transaction.setProviderTransactionId(extraireProviderReference(payload));

            // Stocker les données brutes du callback
            try {
                String jsonData = objectMapper.writeValueAsString(payload);
                transaction.setCallbackData(jsonData);
            } catch (Exception e) {
                log.warn("Impossible de sérialiser le callback en JSON : {}", e.getMessage());
                transaction.setCallbackData(payload.toString());
            }

            if (nouveauStatut == PaymentStatusEnum.CONFIRMED) {
                transaction.setCompletedAt(LocalDateTime.now());
                transaction.setConfirmedAt(LocalDateTime.now());
            }

            if (nouveauStatut == PaymentStatusEnum.FAILED) {
                transaction.setNotes("Échec du paiement : " + extraireMessageErreur(payload));
            }

            transaction = transactionRepository.save(transaction);

            // Créer un log
            TransactionLog transactionLog = TransactionLog.builder()
                    .transaction(transaction)
                    .statusFrom(TransactionStatusEnum.PROCESSING)
                    .statusTo(nouveauStatutTransaction)
                    .message("Callback reçu de " + provider + " : " + status)
                    .build();
            transactionLogRepository.save(transactionLog);

            log.info("Callback {} traité avec succès pour la transaction {}", provider, transaction.getTransactionCode());
            return true;

        } catch (Exception e) {
            log.error("Erreur lors du traitement du callback {} : {}", provider, e.getMessage(), e);
            return false;
        }
    }

    // ─── Méthodes utilitaires pour extraire les données des payloads ───

    private String extraireStatut(Object payload) {
        if (payload instanceof VodacomCallbackPayload) {
            VodacomCallbackPayload p = (VodacomCallbackPayload) payload;
            return p.getStatus() != null ? p.getStatus() : p.getResultCode();
        } else if (payload instanceof AirtelCallbackPayload) {
            return ((AirtelCallbackPayload) payload).getStatus();
        } else if (payload instanceof OrangeCallbackPayload) {
            return ((OrangeCallbackPayload) payload).getStatus();
        }
        return "FAILED";
    }

    private String extraireProviderReference(Object payload) {
        if (payload instanceof VodacomCallbackPayload) {
            return ((VodacomCallbackPayload) payload).getProviderReference();
        } else if (payload instanceof AirtelCallbackPayload) {
            return ((AirtelCallbackPayload) payload).getProviderReference();
        } else if (payload instanceof OrangeCallbackPayload) {
            return ((OrangeCallbackPayload) payload).getProviderReference();
        }
        return null;
    }

    private String extraireMessageErreur(Object payload) {
        if (payload instanceof VodacomCallbackPayload) {
            return ((VodacomCallbackPayload) payload).getResultDescription();
        } else if (payload instanceof AirtelCallbackPayload) {
            return ((AirtelCallbackPayload) payload).getResponseMessage();
        } else if (payload instanceof OrangeCallbackPayload) {
            return ((OrangeCallbackPayload) payload).getResponseMessage();
        }
        return null;
    }

    private PaymentStatusEnum mapStatutProvider(String status) {
        if (status == null) return PaymentStatusEnum.FAILED;

        String upper = status.toUpperCase();
        if (upper.contains("SUCCESS") || upper.contains("CONFIRMED") || "0".equals(upper)) {
            return PaymentStatusEnum.CONFIRMED;
        } else if (upper.contains("PENDING") || upper.contains("IN_PROGRESS")) {
            return PaymentStatusEnum.PENDING;
        } else if (upper.contains("CANCELLED") || upper.contains("CANCEL")) {
            return PaymentStatusEnum.CANCELLED;
        } else if (upper.contains("REFUND") || upper.contains("REVERSED")) {
            return PaymentStatusEnum.REFUNDED;
        } else {
            return PaymentStatusEnum.FAILED;
        }
    }

    private TransactionStatusEnum mapTransactionStatut(String status) {
        if (status == null) return TransactionStatusEnum.FAILED;

        String upper = status.toUpperCase();
        if (upper.contains("SUCCESS") || upper.contains("CONFIRMED") || "0".equals(upper)) {
            return TransactionStatusEnum.CONFIRMED;
        } else if (upper.contains("PENDING") || upper.contains("IN_PROGRESS")) {
            return TransactionStatusEnum.PENDING;
        } else if (upper.contains("CANCELLED") || upper.contains("CANCEL")) {
            return TransactionStatusEnum.CANCELLED;
        } else if (upper.contains("REFUND") || upper.contains("REVERSED")) {
            return TransactionStatusEnum.REFUNDED;
        } else {
            return TransactionStatusEnum.FAILED;
        }
    }
}