package cd.genuc.controller;

import cd.genuc.dto.ReportGenerateDto;
import cd.genuc.model.PaymentReport;
import cd.genuc.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.Map;

/**
 * ReportController - REST API pour la génération de rapports
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reports", description = "Payment reports API")
public class ReportController {
    private final ReportService reportService;

    /**
     * Generate daily payment report
     * POST /api/v1/reports/daily
     */
    @PostMapping("/daily")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'UNIVERSITY_ADMIN')")
    @Operation(summary = "Generate daily payment report")
    public ResponseEntity<Map<String, Object>> generateDailyReport(
            @Valid @RequestBody ReportGenerateDto request) {
        log.info("Generating daily report: universite={}, date={}", request.getUniversiteId(), request.getReportDate());

        PaymentReport report = reportService.generateDailyReport(
                request.getUniversiteId(),
                request.getReportDate(),
                request.getGeneratedBy()
        );

        return ResponseEntity.ok(mapReportToResponse(report));
    }

    /**
     * Generate monthly payment report
     * POST /api/v1/reports/monthly
     */
    @PostMapping("/monthly")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'UNIVERSITY_ADMIN')")
    @Operation(summary = "Generate monthly payment report")
    public ResponseEntity<Map<String, Object>> generateMonthlyReport(
            @RequestParam Long universiteId,
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam Long generatedBy) {
        log.info("Generating monthly report: universite={}, month={}/{}", universiteId, month, year);

        PaymentReport report = reportService.generateMonthlyReport(
                universiteId,
                month,
                year,
                generatedBy
        );

        return ResponseEntity.ok(mapReportToResponse(report));
    }

    /**
     * Get payment summary by method
     * GET /api/v1/reports/summary-by-method
     */
    @GetMapping("/summary-by-method")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER', 'UNIVERSITY_ADMIN')")
    @Operation(summary = "Get payment summary by method")
    public ResponseEntity<Map<String, Object>> getPaymentSummaryByMethod(
            @RequestParam Long universiteId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        log.info("Fetching payment summary: universite={}, period={} to {}", universiteId, startDate, endDate);
        return ResponseEntity.ok(reportService.getPaymentSummaryByMethod(universiteId, startDate, endDate));
    }

    /**
     * Map report to response
     */
    private Map<String, Object> mapReportToResponse(PaymentReport report) {
        return Map.of(
                "report_code", report.getReportCode(),
                "report_type", report.getReportType(),
                "period_start", report.getPeriodStart(),
                "period_end", report.getPeriodEnd(),
                "total_collected_fc", report.getTotalCollectedFc(),
                "total_collected_usd", report.getTotalCollectedUsd(),
                "total_pending_fc", report.getTotalPendingFc(),
                "number_of_transactions", report.getNumberOfTransactions(),
                "students_paid", report.getNumberOfStudentsPaid(),
                "collection_rate", report.getCollectionRate()
        );
    }
}
