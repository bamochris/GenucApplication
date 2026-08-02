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

/**
 * ReportService - Génération de rapports financiers
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReportService {
    private final PaymentReportRepository paymentReportRepository;
    private final TransactionRepository transactionRepository;
    private final ExchangeRateService exchangeRateService;

    /**
     * Generate daily payment report
     */
    public PaymentReport generateDailyReport(Long universiteId, LocalDate reportDate, Long generatedBy) {
        log.info("Generating daily report: universite={}, date={}", universiteId, reportDate);

        LocalDateTime startOfDay = reportDate.atStartOfDay();
        LocalDateTime endOfDay = reportDate.atTime(23, 59, 59);

        List<Transaction> transactions = transactionRepository
                .findTransactionsByDateRangeAndUniversity(startOfDay, endOfDay, universiteId);

        return createPaymentReport(universiteId, reportDate, reportDate, "DAILY", transactions, generatedBy);
    }

    /**
     * Generate monthly payment report
     */
    public PaymentReport generateMonthlyReport(Long universiteId, int month, int year, Long generatedBy) {
        log.info("Generating monthly report: universite={}, month={}/{}", universiteId, month, year);

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        LocalDateTime startOfMonth = startDate.atStartOfDay();
        LocalDateTime endOfMonth = endDate.atTime(23, 59, 59);

        List<Transaction> transactions = transactionRepository
                .findTransactionsByDateRangeAndUniversity(startOfMonth, endOfMonth, universiteId);

        return createPaymentReport(universiteId, startDate, endDate, "MONTHLY", transactions, generatedBy);
    }

    /**
     * Create payment report
     */
    private PaymentReport createPaymentReport(
            Long universiteId,
            LocalDate periodStart,
            LocalDate periodEnd,
            String reportType,
            List<Transaction> transactions,
            Long generatedBy) {

        // Calculate statistics
        BigDecimal totalCollectedFc = transactions.stream()
                .filter(t -> t.getPaymentStatus() == PaymentStatusEnum.CONFIRMED)
                .map(Transaction::getAmountFc)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCollectedUsd = exchangeRateService.convertFcToUsd(totalCollectedFc);

        BigDecimal totalPendingFc = transactions.stream()
                .filter(t -> t.getPaymentStatus() == PaymentStatusEnum.PENDING)
                .map(Transaction::getAmountFc)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long numberOfStudentsPaid = transactions.stream()
                .filter(t -> t.getPaymentStatus() == PaymentStatusEnum.CONFIRMED)
                .map(Transaction::getStudent)
                .distinct()
                .count();

        BigDecimal collectionRate = transactions.isEmpty() ? BigDecimal.ZERO :
                totalCollectedFc.divide(
                        transactions.stream()
                                .map(Transaction::getAmountFc)
                                .reduce(BigDecimal.ZERO, BigDecimal::add),
                        2,
                        java.math.RoundingMode.HALF_UP
                );

        PaymentReport report = PaymentReport.builder()
                .reportCode(generateReportCode(universiteId, reportType))
                .universite(Universite.builder().id(universiteId).build())
                .reportType(reportType)
                .reportDate(LocalDate.now())
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .totalCollectedFc(totalCollectedFc)
                .totalCollectedUsd(totalCollectedUsd)
                .totalPendingFc(totalPendingFc)
                .numberOfTransactions(transactions.size())
                .numberOfStudentsPaid((int) numberOfStudentsPaid)
                .collectionRate(collectionRate)
                .generatedBy(Utilisateur.builder().id(generatedBy).build())
                .build();

        return paymentReportRepository.save(report);
    }

    /**
     * Get payment summary by method
     */
    public Map<String, Object> getPaymentSummaryByMethod(Long universiteId, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions = transactionRepository
                .findTransactionsByDateRangeAndUniversity(
                        startDate.atStartOfDay(),
                        endDate.atTime(23, 59, 59),
                        universiteId
                );

        Map<String, Long> methodCounts = transactions.stream()
                .collect(
                        java.util.stream.Collectors.groupingBy(
                                t -> t.getPaymentMethod().toString(),
                                java.util.stream.Collectors.counting()
                        )
                );

        return Map.of(
                "period_start", startDate,
                "period_end", endDate,
                "total_transactions", transactions.size(),
                "payment_methods", methodCounts
        );
    }

    /**
     * Generate report code
     */
    private String generateReportCode(Long universiteId, String reportType) {
        return String.format("RPT-%d-%s-%d",
                universiteId,
                reportType,
                System.currentTimeMillis());
    }
}
