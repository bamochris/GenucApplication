package cd.genuc.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GenericCallbackResponse {

    private boolean success;
    private String message;
    private String provider;
    private String transactionCode;
    private LocalDateTime timestamp;

    public static GenericCallbackResponse success(String provider, String transactionCode) {
        return GenericCallbackResponse.builder()
                .success(true)
                .message("Callback traité avec succès")
                .provider(provider)
                .transactionCode(transactionCode)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static GenericCallbackResponse error(String provider, String transactionCode, String message) {
        return GenericCallbackResponse.builder()
                .success(false)
                .message(message)
                .provider(provider)
                .transactionCode(transactionCode)
                .timestamp(LocalDateTime.now())
                .build();
    }
}