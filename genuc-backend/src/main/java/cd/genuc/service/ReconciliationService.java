package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ReconciliationService - Réconciliation bancaire
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReconciliationService {
    private final PaymentReconciliationRepository reconciliationRepository;
    private final ReconciliationDetailRepository detailRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Create reconciliation from bank statement
     */
    public PaymentReconciliation createReconciliation(
            Long universiteId,
            LocalDate bankStatementDate,
            BigDecimal totalExpected,
            BigDecimal totalReceived) {

        log.info("Creating reconciliation: universite={}, date={}", universiteId, bankStatementDate);

        String reconciliationCode = generateReconciliationCode(universiteId);

        PaymentReconciliation reconciliation = PaymentReconciliation.builder()
                .reconciliationCode(reconciliationCode)
                .universite(Universite.builder().id(universiteId).build())
                .bankStatementDate(bankStatementDate)
                .totalExpected(totalExpected)
                .totalReceived(totalReceived)
                .difference(totalExpected.subtract(totalReceived))
                .status(ReconciliationStatusEnum.PENDING)
                .build();

        return reconciliationRepository.save(reconciliation);
    }

    /**
     * Match transactions to bank statement
     */
    public void matchTransactions(Long reconciliationId, Map<String, BigDecimal> bankTransactions) {
        log.info("Matching transactions for reconciliation: {}", reconciliationId);

        PaymentReconciliation reconciliation = reconciliationRepository.findById(reconciliationId)
                .orElseThrow(() -> new IllegalArgumentException("Reconciliation not found"));

        for (Map.Entry<String, BigDecimal> entry : bankTransactions.entrySet()) {
            String bankReference = entry.getKey();
            BigDecimal bankAmount = entry.getValue();

            // Try to find matching transaction
            List<Transaction> matchingTransactions = transactionRepository
                    .findByUniversiteId(reconciliation.getUniversite().getId())
                    .stream()
                    .filter(t -> t.getPaymentStatus() == PaymentStatusEnum.CONFIRMED)
                    .filter(t -> t.getAmountFc().compareTo(bankAmount) == 0)
                    .collect(Collectors.toList());

            if (!matchingTransactions.isEmpty()) {
                Transaction transaction = matchingTransactions.get(0);
                createReconciliationDetail(reconciliation, transaction, bankReference, bankAmount, true);
            } else {
                createReconciliationDetail(reconciliation, null, bankReference, bankAmount, false);
            }
        }

        // Check if fully reconciled
        List<ReconciliationDetail> unmatched = detailRepository.findUnmatchedByReconciliation(reconciliationId);
        if (unmatched.isEmpty()) {
            reconciliation.setStatus(ReconciliationStatusEnum.MATCHED);
            reconciliation.setReconciliationDate(LocalDate.now());
            reconciliationRepository.save(reconciliation);
            log.info("Reconciliation completed: {}", reconciliationId);
        }
    }

    /**
     * Create reconciliation detail
     */
    private void createReconciliationDetail(
            PaymentReconciliation reconciliation,
            Transaction transaction,
            String bankReference,
            BigDecimal bankAmount,
            boolean isMatched) {

        ReconciliationDetail detail = ReconciliationDetail.builder()
                .reconciliation(reconciliation)
                .transaction(transaction)
                .bankReference(bankReference)
                .bankAmount(bankAmount)
                .transactionAmount(transaction != null ? transaction.getAmountFc() : null)
                .isMatched(isMatched)
                .matchDate(isMatched ? LocalDateTime.now() : null)
                .build();

        detailRepository.save(detail);
    }

    /**
     * Get reconciliation report
     */
    public Map<String, Object> getReconciliationReport(Long reconciliationId) {
        PaymentReconciliation reconciliation = reconciliationRepository.findById(reconciliationId)
                .orElseThrow(() -> new IllegalArgumentException("Reconciliation not found"));

        List<ReconciliationDetail> matched = detailRepository.findMatchedByReconciliation(reconciliationId);
        List<ReconciliationDetail> unmatched = detailRepository.findUnmatchedByReconciliation(reconciliationId);

        return Map.of(
                "reconciliation_code", reconciliation.getReconciliationCode(),
                "status", reconciliation.getStatus(),
                "total_expected", reconciliation.getTotalExpected(),
                "total_received", reconciliation.getTotalReceived(),
                "difference", reconciliation.getDifference(),
                "matched_transactions", matched.size(),
                "unmatched_transactions", unmatched.size()
        );
    }

    /**
     * Generate reconciliation code
     */
    private String generateReconciliationCode(Long universiteId) {
        return String.format("REC-%d-%d",
                universiteId,
                System.currentTimeMillis());
    }
}
