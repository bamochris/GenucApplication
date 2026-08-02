package cd.genuc.controller;

import cd.genuc.dto.ReconciliationCreateDto;
import cd.genuc.model.PaymentReconciliation;
import cd.genuc.service.ReconciliationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

/**
 * ReconciliationController - REST API pour la réconciliation bancaire
 */
@RestController
@RequestMapping("/api/v1/reconciliation")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reconciliation", description = "Bank reconciliation API")
public class ReconciliationController {
    private final ReconciliationService reconciliationService;

    /**
     * Create reconciliation
     * POST /api/v1/reconciliation/create
     */
    @PostMapping("/create")
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    @Operation(summary = "Create bank reconciliation")
    public ResponseEntity<Map<String, Object>> createReconciliation(
            @Valid @RequestBody ReconciliationCreateDto request) {
        log.info("Creating reconciliation: universite={}, date={}", request.getUniversiteId(), request.getBankStatementDate());

        PaymentReconciliation reconciliation = reconciliationService.createReconciliation(
                request.getUniversiteId(),
                request.getBankStatementDate(),
                request.getTotalExpected(),
                request.getTotalReceived()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "reconciliation_code", reconciliation.getReconciliationCode(),
                        "status", reconciliation.getStatus(),
                        "total_expected", reconciliation.getTotalExpected(),
                        "total_received", reconciliation.getTotalReceived(),
                        "difference", reconciliation.getDifference()
                ));
    }

    /**
     * Match transactions to bank statement
     * POST /api/v1/reconciliation/{reconciliationId}/match
     */
    @PostMapping("/{reconciliationId}/match")
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    @Operation(summary = "Match transactions to bank statement")
    public ResponseEntity<Map<String, Object>> matchTransactions(
            @PathVariable Long reconciliationId,
            @RequestBody Map<String, java.math.BigDecimal> bankTransactions) {
        log.info("Matching transactions for reconciliation: {}", reconciliationId);

        reconciliationService.matchTransactions(reconciliationId, bankTransactions);

        return ResponseEntity.ok(Map.of(
                "message", "Transactions matched successfully",
                "reconciliation_id", reconciliationId
        ));
    }

    /**
     * Get reconciliation report
     * GET /api/v1/reconciliation/{reconciliationId}/report
     */
    @GetMapping("/{reconciliationId}/report")
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    @Operation(summary = "Get reconciliation report")
    public ResponseEntity<Map<String, Object>> getReconciliationReport(
            @PathVariable Long reconciliationId) {
        log.info("Fetching reconciliation report: {}", reconciliationId);
        return ResponseEntity.ok(reconciliationService.getReconciliationReport(reconciliationId));
    }
}
