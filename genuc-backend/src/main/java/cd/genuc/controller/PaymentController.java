package cd.genuc.controller;

import cd.genuc.dto.PaymentRequestDto;
import cd.genuc.dto.PaymentResponseDto;
import cd.genuc.dto.RefundRequestDto;
import cd.genuc.model.PaymentMethodEnum;
import cd.genuc.model.Transaction;
import cd.genuc.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

/**
 * PaymentController - REST API pour la gestion des paiements
 * Support: Vodacom M-Pesa, Airtel Money, Orange Money
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payments", description = "Payment management API")
public class PaymentController {
    private final PaymentService paymentService;

    /**
     * Initiate a new payment
     * POST /api/v1/payments/initiate
     */
    @PostMapping("/initiate")
    @PreAuthorize("hasAnyRole('STUDENT', 'PARENT', 'FINANCE_MANAGER')")
    @Operation(summary = "Initiate a payment")
    public ResponseEntity<PaymentResponseDto> initiatePayment(@Valid @RequestBody PaymentRequestDto request) {
        log.info("Initiating payment: student={}, amount={}", request.getStudentId(), request.getAmountFc());

        Transaction transaction = paymentService.initiatePayment(
                request.getStudentId(),
                request.getUniversiteId(),
                request.getAmountFc(),
                request.getTransactionType(),
                PaymentMethodEnum.valueOf(request.getPaymentMethod()),
                request.getDescription()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapToResponse(transaction));
    }

    /**
     * Process payment
     * POST /api/v1/payments/{transactionId}/process
     */
    @PostMapping("/{transactionId}/process")
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    @Operation(summary = "Process a payment")
    public ResponseEntity<PaymentResponseDto> processPayment(@PathVariable Long transactionId) {
        log.info("Processing payment: transactionId={}", transactionId);

        Transaction transaction = paymentService.processPayment(transactionId);
        return ResponseEntity.ok(mapToResponse(transaction));
    }

    /**
     * Confirm payment (webhook callback)
     * POST /api/v1/payments/confirm
     */
    @PostMapping("/confirm")
    @Operation(summary = "Confirm payment (webhook)")
    public ResponseEntity<PaymentResponseDto> confirmPayment(
            @RequestParam String providerTransactionId,
            @RequestParam(required = false) java.math.BigDecimal confirmedAmount) {
        log.info("Confirming payment: provider_transaction_id={}", providerTransactionId);

        Transaction transaction = paymentService.confirmPayment(
                providerTransactionId,
                confirmedAmount != null ? confirmedAmount : java.math.BigDecimal.ZERO
        );
        return ResponseEntity.ok(mapToResponse(transaction));
    }

    /**
     * Get payment statistics
     * GET /api/v1/payments/statistics/{universiteId}
     */
    @GetMapping("/statistics/{universiteId}")
    @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN', 'FINANCE_MANAGER')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    @Operation(summary = "Get payment statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(@PathVariable Long universiteId) {
        log.info("Fetching payment statistics: universiteId={}", universiteId);
        return ResponseEntity.ok(paymentService.getPaymentStatistics(universiteId));
    }

    /**
     * Process refund
     * POST /api/v1/payments/{transactionId}/refund
     */
    @PostMapping("/{transactionId}/refund")
    @PreAuthorize("hasRole('FINANCE_MANAGER')")
    @Operation(summary = "Process a refund")
    public ResponseEntity<Map<String, Object>> processRefund(
            @PathVariable Long transactionId,
            @Valid @RequestBody RefundRequestDto request) {
        log.info("Processing refund: transactionId={}", transactionId);

        var refund = paymentService.processRefund(
                transactionId,
                request.getAmountFc(),
                request.getReason(),
                request.getRequestedBy()
        );

        return ResponseEntity.ok(Map.of(
                "refund_code", refund.getRefundCode(),
                "amount_fc", refund.getAmountFc(),
                "status", refund.getStatus()
        ));
    }

    /**
     * Map Transaction to response DTO
     */
    private PaymentResponseDto mapToResponse(Transaction transaction) {
        return PaymentResponseDto.builder()
                .transactionCode(transaction.getTransactionCode())
                .transactionId(transaction.getId())
                .amountFc(transaction.getAmountFc())
                .amountUsd(transaction.getAmountUsd())
                .paymentStatus(transaction.getPaymentStatus().toString())
                .transactionStatus(transaction.getTransactionStatus().toString())
                .paymentMethod(transaction.getPaymentMethod().toString())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
