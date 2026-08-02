package cd.genuc.controller;

import cd.genuc.dto.GenericCallbackResponse;
import cd.genuc.dto.callback.AirtelCallbackPayload;
import cd.genuc.dto.callback.OrangeCallbackPayload;
import cd.genuc.dto.callback.VodacomCallbackPayload;
import cd.genuc.service.CallbackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/callback")
@RequiredArgsConstructor
@Slf4j
public class CallbackController {

    private final CallbackService callbackService;

    /**
     * Endpoint de callback pour Vodacom M-Pesa.
     */
    @PostMapping("/vodacom")
    public ResponseEntity<GenericCallbackResponse> handleVodacomCallback(
            @RequestBody VodacomCallbackPayload payload) {

        log.info("📩 Callback Vodacom reçu : {}", payload);

        try {
            boolean success = callbackService.traiterCallbackVodacom(payload);

            if (success) {
                return ResponseEntity.ok(GenericCallbackResponse.success("Vodacom", payload.getTransactionCode()));
            } else {
                return ResponseEntity.status(500).body(
                        GenericCallbackResponse.error("Vodacom", payload.getTransactionCode(), "Erreur lors du traitement du callback")
                );
            }
        } catch (Exception e) {
            log.error("Erreur lors du traitement du callback Vodacom : {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                    GenericCallbackResponse.error("Vodacom", null, e.getMessage())
            );
        }
    }

    /**
     * Endpoint de callback pour Airtel Money.
     */
    @PostMapping("/airtel")
    public ResponseEntity<GenericCallbackResponse> handleAirtelCallback(
            @RequestBody AirtelCallbackPayload payload) {

        log.info("📩 Callback Airtel reçu : {}", payload);

        try {
            boolean success = callbackService.traiterCallbackAirtel(payload);

            if (success) {
                return ResponseEntity.ok(GenericCallbackResponse.success("Airtel", payload.getTransactionCode()));
            } else {
                return ResponseEntity.status(500).body(
                        GenericCallbackResponse.error("Airtel", payload.getTransactionCode(), "Erreur lors du traitement du callback")
                );
            }
        } catch (Exception e) {
            log.error("Erreur lors du traitement du callback Airtel : {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                    GenericCallbackResponse.error("Airtel", null, e.getMessage())
            );
        }
    }

    /**
     * Endpoint de callback pour Orange Money.
     */
    @PostMapping("/orange")
    public ResponseEntity<GenericCallbackResponse> handleOrangeCallback(
            @RequestBody OrangeCallbackPayload payload) {

        log.info("📩 Callback Orange reçu : {}", payload);

        try {
            boolean success = callbackService.traiterCallbackOrange(payload);

            if (success) {
                return ResponseEntity.ok(GenericCallbackResponse.success("Orange", payload.getTransactionCode()));
            } else {
                return ResponseEntity.status(500).body(
                        GenericCallbackResponse.error("Orange", payload.getTransactionCode(), "Erreur lors du traitement du callback")
                );
            }
        } catch (Exception e) {
            log.error("Erreur lors du traitement du callback Orange : {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                    GenericCallbackResponse.error("Orange", null, e.getMessage())
            );
        }
    }
}