package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final TransactionRepository transactionRepository;
    private final TransactionLogRepository transactionLogRepository;
    private final EtudiantRepository etudiantRepository;
    private final UniversiteRepository universiteRepository;
    private final RefundRepository refundRepository;
    private final UtilisateurRepository utilisateurRepository;

    // ════════════════════════════════════════════
    // CRÉER UNE TRANSACTION
    // ════════════════════════════════════════════

    @Transactional
    public Transaction creerTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    // ════════════════════════════════════════════
    // RÉCUPÉRER UNE TRANSACTION
    // ════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Transaction obtenirTransaction(Long id) {
        return transactionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transaction non trouvée : " + id));
    }

    @Transactional(readOnly = true)
    public Transaction obtenirParCode(String transactionCode) {
        return transactionRepository.findByTransactionCode(transactionCode)
            .orElseThrow(() -> new RuntimeException("Transaction non trouvée : " + transactionCode));
    }

    @Transactional(readOnly = true)
    public Transaction obtenirParProviderTransactionId(String providerTransactionId) {
        return transactionRepository.findByProviderTransactionId(providerTransactionId)
            .orElseThrow(() -> new RuntimeException("Transaction provider non trouvée : " + providerTransactionId));
    }

    // ════════════════════════════════════════════
    // LISTER LES TRANSACTIONS
    // ════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<Transaction> obtenirTransactionsEtudiant(Long studentId) {
        return transactionRepository.findByStudentId(studentId);
    }

    @Transactional(readOnly = true)
    public Page<Transaction> obtenirTransactionsEtudiantPaginee(Long studentId, Pageable pageable) {
        return transactionRepository.findByStudentId(studentId, pageable);
    }

    @Transactional(readOnly = true)
    public List<Transaction> obtenirTransactionsUniversite(Long universiteId) {
        return transactionRepository.findByUniversiteId(universiteId);
    }

    @Transactional(readOnly = true)
    public Page<Transaction> obtenirTransactionsUniversitePaginee(Long universiteId, Pageable pageable) {
        return transactionRepository.findByUniversiteId(universiteId, pageable);
    }

    // ════════════════════════════════════════════
    // METTRE À JOUR UNE TRANSACTION
    // ════════════════════════════════════════════

    @Transactional
    public Transaction mettreAJourTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction mettreAJourStatut(Long transactionId, PaymentStatusEnum newStatus) {
        Transaction transaction = obtenirTransaction(transactionId);
        transaction.setPaymentStatus(newStatus); // ✅ corrigé
        return transactionRepository.save(transaction);
    }

    // ════════════════════════════════════════════
    // GÉRER LES LOGS DE TRANSACTION
    // ════════════════════════════════════════════

    @Transactional
    public TransactionLog creerLog(Long transactionId, TransactionStatusEnum statusFrom, 
                                    TransactionStatusEnum statusTo, String message) {
        Transaction transaction = obtenirTransaction(transactionId);

        // ✅ Si vous avez ajouté @Builder à TransactionLog
        TransactionLog log = TransactionLog.builder()
            .transaction(transaction)
            .statusFrom(statusFrom)
            .statusTo(statusTo)
            .message(message)
            .createdAt(LocalDateTime.now())
            .build();

        return transactionLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<TransactionLog> obtenirLogsTransaction(Long transactionId) {
        return transactionLogRepository.findByTransactionIdOrderByCreatedAtDesc(transactionId);
    }

    @Transactional(readOnly = true)
    public List<TransactionLog> obtenirLogsParStatut(Long transactionId, TransactionStatusEnum status) {
        return transactionLogRepository.findByTransactionAndStatus(transactionId, status);
    }

    @Transactional(readOnly = true)
    public List<TransactionLog> obtenirLogsParPlage(LocalDateTime debut, LocalDateTime fin) {
        return transactionLogRepository.findByDateRange(debut, fin);
    }

    @Transactional(readOnly = true)
    public List<TransactionLog> obtenirLogsEchouesParPlage(LocalDateTime debut, LocalDateTime fin) {
        return transactionLogRepository.findFailedTransactionsByDateRange(
            TransactionStatusEnum.FAILED, debut, fin
        );
    }

    // ════════════════════════════════════════════
    // RAPPORTS
    // ════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Map<String, Object> genererRapportUniversite(Long universiteId) {
        List<Transaction> transactions = obtenirTransactionsUniversite(universiteId);

        Map<String, Object> rapport = new LinkedHashMap<>();
        rapport.put("universiteId", universiteId);
        rapport.put("totalTransactions", transactions.size());
        rapport.put("transactionsReussies", 
            transactions.stream()
                .filter(t -> t.getPaymentStatus() == PaymentStatusEnum.CONFIRMED) // ✅ corrigé
                .count());
        rapport.put("transactionsEnAttente", 
            transactions.stream()
                .filter(t -> t.getPaymentStatus() == PaymentStatusEnum.PENDING)   // ✅ corrigé
                .count());
        rapport.put("transactionsEchouees", 
            transactions.stream()
                .filter(t -> t.getPaymentStatus() == PaymentStatusEnum.FAILED)    // ✅ corrigé
                .count());
        rapport.put("genereA", LocalDateTime.now());

        return rapport;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> genererRapportEtudiant(Long studentId) {
        List<Transaction> transactions = obtenirTransactionsEtudiant(studentId);

        double montantTotal = transactions.stream()
            .filter(t -> t.getPaymentStatus() == PaymentStatusEnum.CONFIRMED)      // ✅ corrigé
            .mapToDouble(t -> t.getAmountFc().doubleValue())
            .sum();

        Map<String, Object> rapport = new LinkedHashMap<>();
        rapport.put("studentId", studentId);
        rapport.put("totalTransactions", transactions.size());
        rapport.put("montantTotal", montantTotal);
        rapport.put("transactionsReussies", 
            transactions.stream()
                .filter(t -> t.getPaymentStatus() == PaymentStatusEnum.CONFIRMED) // ✅ corrigé
                .count());
        rapport.put("genereA", LocalDateTime.now());

        return rapport;
    }

    // ════════════════════════════════════════════
    // SUPPRESSION
    // ════════════════════════════════════════════

    @Transactional
    public void supprimerTransaction(Long transactionId) {
        transactionRepository.deleteById(transactionId);
    }

    @Transactional(readOnly = true)
    public long compterTransactionsEtudiant(Long studentId) {
        return obtenirTransactionsEtudiant(studentId).size();
    }

    @Transactional
    public Transaction initiatePayment(Long studentId, Long universiteId, BigDecimal amountFc,
                                       String transactionType, PaymentMethodEnum paymentMethod,
                                       String description) {
        Etudiant student = etudiantRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));
        Universite universite = universiteRepository.findById(universiteId)
                .orElseThrow(() -> new RuntimeException("Université introuvable"));

        Transaction transaction = Transaction.builder()
                .transactionCode("TXN-" + System.currentTimeMillis())
                .transactionType(transactionType)
                .student(student)
                .universite(universite)
                .amountFc(amountFc)
                .paymentMethod(paymentMethod)
                .paymentStatus(PaymentStatusEnum.PENDING)
                .transactionStatus(TransactionStatusEnum.INITIATED)
                .description(description)
                .build();
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction processPayment(Long transactionId) {
        Transaction transaction = obtenirTransaction(transactionId);
        transaction.setTransactionStatus(TransactionStatusEnum.PROCESSING);
        transaction.setPaymentStatus(PaymentStatusEnum.PENDING);
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction confirmPayment(String providerTransactionId, BigDecimal confirmedAmount) {
        Transaction transaction = obtenirParProviderTransactionId(providerTransactionId);
        transaction.setProviderTransactionId(providerTransactionId);
        transaction.setPaymentStatus(PaymentStatusEnum.CONFIRMED);
        transaction.setTransactionStatus(TransactionStatusEnum.COMPLETED);
        transaction.setConfirmedAt(LocalDateTime.now());
        transaction.setCompletedAt(LocalDateTime.now());
        if (confirmedAmount != null && confirmedAmount.compareTo(BigDecimal.ZERO) > 0) {
            transaction.setAmountFc(confirmedAmount);
        }
        creerLog(transaction.getId(), TransactionStatusEnum.PROCESSING,
                TransactionStatusEnum.COMPLETED, "Paiement confirmé");
        return transactionRepository.save(transaction);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentStatistics(Long universiteId) {
        return genererRapportUniversite(universiteId);
    }

    @Transactional
    public Refund processRefund(Long transactionId, BigDecimal amountFc, String reason, Long requestedById) {
        Transaction transaction = obtenirTransaction(transactionId);
        Utilisateur requestedBy = utilisateurRepository.findById(requestedById)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Refund refund = Refund.builder()
                .refundCode("REF-" + System.currentTimeMillis())
                .transaction(transaction)
                .amountFc(amountFc)
                .reason(reason)
                .refundMethod(transaction.getPaymentMethod())
                .status(PaymentStatusEnum.PENDING)
                .requestedBy(requestedBy)
                .build();
        return refundRepository.save(refund);
    }
}