package cd.genuc.controller;

import cd.genuc.dto.PaymentInitiateRequest;
import cd.genuc.dto.PaymentInitiateResponse;
import cd.genuc.dto.PaymentStatusResponse;
import cd.genuc.exception.PaymentException;
import cd.genuc.model.Etudiant;
import cd.genuc.model.Transaction;
import cd.genuc.model.Universite;
import cd.genuc.service.EtudiantService;
import cd.genuc.service.PaymentOrchestratorService;
import cd.genuc.service.UniversiteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/mobile")
@RequiredArgsConstructor
@Slf4j
public class PaymentMobileController {

    private final PaymentOrchestratorService paymentOrchestratorService;
    private final EtudiantService etudiantService;
    private final UniversiteService universiteService;

    /**
     * Initie un paiement mobile via le provider choisi.
     */
    @PostMapping("/initiate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentInitiateResponse> initierPaiement(
            @Valid @RequestBody PaymentInitiateRequest request) {

        log.info("Requête d'initiation de paiement : {}", request);

        try {
            // Récupérer l'étudiant et l'université
            Etudiant etudiant = etudiantService.getEtudiantById(request.getEtudiantId());
            Universite universite = universiteService.obtenir(request.getUniversiteId());

            // Appeler le service orchestrateur
            Transaction transaction = paymentOrchestratorService.initierPaiement(
                    etudiant,
                    universite,
                    request.getMontantFC(),
                    request.getMethod(),
                    request.getDescription()
            );

            // Construire la réponse
            PaymentInitiateResponse response = PaymentInitiateResponse.builder()
                    .transactionCode(transaction.getTransactionCode())
                    .providerTransactionId(transaction.getProviderTransactionId())
                    .amountFC(transaction.getAmountFc())
                    .amountUSD(transaction.getAmountUsd())
                    .paymentStatus(transaction.getPaymentStatus())
                    .transactionStatus(transaction.getTransactionStatus())
                    .message("Transaction initiée avec succès")
                    .initiatedAt(transaction.getInitiatedAt())
                    .build();

            HttpStatus status = (transaction.getPaymentStatus() == cd.genuc.model.PaymentStatusEnum.CONFIRMED)
                    ? HttpStatus.CREATED
                    : HttpStatus.ACCEPTED;

            return ResponseEntity.status(status).body(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            log.error("Erreur de configuration ou paramètre : {}", e.getMessage());
            throw new PaymentException(e.getMessage(), "INVALID_REQUEST");
        } catch (Exception e) {
            log.error("Erreur lors de l'initiation du paiement : {}", e.getMessage(), e);
            throw new PaymentException("Erreur technique lors de l'initiation du paiement", "TECHNICAL_ERROR");
        }
    }

    /**
     * Vérifie le statut d'une transaction.
     */
    @GetMapping("/transaction/{transactionCode}")
    @PreAuthorize("@securityService.peutAccederTransactionParCode(#transactionCode, authentication)")
    public ResponseEntity<PaymentStatusResponse> getTransactionStatus(
            @PathVariable String transactionCode) {

        log.info("Vérification du statut de la transaction : {}", transactionCode);

        try {
            Transaction transaction = paymentOrchestratorService.getTransactionStatus(transactionCode);

            PaymentStatusResponse response = PaymentStatusResponse.builder()
                    .transactionCode(transaction.getTransactionCode())
                    .providerTransactionId(transaction.getProviderTransactionId())
                    .amountFC(transaction.getAmountFc())
                    .amountUSD(transaction.getAmountUsd())
                    .paymentStatus(transaction.getPaymentStatus())
                    .transactionStatus(transaction.getTransactionStatus())
                    .notes(transaction.getNotes())
                    .initiatedAt(transaction.getInitiatedAt())
                    .completedAt(transaction.getCompletedAt())
                    .message("Statut récupéré avec succès")
                    .build();

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("Transaction non trouvée : {}", transactionCode);
            throw new PaymentException("Transaction introuvable : " + transactionCode, "NOT_FOUND");
        } catch (Exception e) {
            log.error("Erreur lors de la vérification du statut : {}", e.getMessage(), e);
            throw new PaymentException("Erreur technique lors de la vérification du statut", "TECHNICAL_ERROR");
        }
    }

    /**
     * Annule une transaction en attente.
     */
    @PostMapping("/transaction/{transactionId}/cancel")
    @PreAuthorize("@securityService.peutAccederTransaction(#transactionId, authentication)")
    public ResponseEntity<PaymentStatusResponse> annulerTransaction(
            @PathVariable Long transactionId) {

        log.info("Demande d'annulation de la transaction : {}", transactionId);

        try {
            Transaction transaction = paymentOrchestratorService.annulerTransaction(transactionId);

            PaymentStatusResponse response = PaymentStatusResponse.builder()
                    .transactionCode(transaction.getTransactionCode())
                    .providerTransactionId(transaction.getProviderTransactionId())
                    .amountFC(transaction.getAmountFc())
                    .amountUSD(transaction.getAmountUsd())
                    .paymentStatus(transaction.getPaymentStatus())
                    .transactionStatus(transaction.getTransactionStatus())
                    .notes(transaction.getNotes())
                    .initiatedAt(transaction.getInitiatedAt())
                    .completedAt(transaction.getCompletedAt())
                    .message("Transaction annulée avec succès")
                    .build();

            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            log.warn("Impossible d'annuler la transaction {} : {}", transactionId, e.getMessage());
            throw new PaymentException(e.getMessage(), "INVALID_STATE");
        } catch (RuntimeException e) {
            log.error("Transaction non trouvée : {}", transactionId);
            throw new PaymentException("Transaction introuvable : " + transactionId, "NOT_FOUND");
        } catch (Exception e) {
            log.error("Erreur lors de l'annulation : {}", e.getMessage(), e);
            throw new PaymentException("Erreur technique lors de l'annulation", "TECHNICAL_ERROR");
        }
    }

    /**
     * Endpoint de callback pour les notifications des providers.
     * (Sera implémenté dans la phase suivante)
     */
    @PostMapping("/callback/{provider}")
    public ResponseEntity<String> handleCallback(
            @PathVariable String provider,
            @RequestBody Object payload) {

        log.info("Callback reçu de {} : {}", provider, payload);
        // TODO: Implémenter la logique de callback
        return ResponseEntity.ok("Callback reçu");
    }
}