package cd.genuc.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

/**
 * Enveloppe standardisée des réponses REST GENUC.
 *
 * Contrat JSON :
 *   Succès : { "success": true,  "status": 200, "message": ..., "data": ..., "timestamp": ... }
 *   Erreur : { "success": false, "status": 4xx/5xx, "code": "...", "message": ...,
 *              "erreurs": {champ: message}?, "timestamp": ... }
 *
 * Le format d'erreur reprend EXACTEMENT les clés historiques émises par
 * GlobalExceptionHandler (code, message, status, timestamp, erreurs) afin de
 * rester compatible avec utils/errorHandler.js côté frontend ; seul le champ
 * additif "success" s'y ajoute. Les champs null sont omis du JSON.
 *
 * Usage : nouvelle API → ResponseEntity.ok(ApiResponse.ok(dto)) ;
 * les endpoints existants conservent leur format tant que le frontend
 * n'est pas migré (voir documentation/10-reference-api-rest.txt §1.2).
 */
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final int status;
    private final String code;
    private final String message;
    private final T data;
    private final Map<String, String> erreurs;
    private final long timestamp;

    public static <T> ApiResponse<T> ok(T data) {
        return ok(data, null);
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder()
            .success(true)
            .status(200)
            .message(message)
            .data(data)
            .timestamp(System.currentTimeMillis())
            .build();
    }

    public static <T> ApiResponse<T> created(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .status(201)
            .data(data)
            .timestamp(System.currentTimeMillis())
            .build();
    }

    public static ApiResponse<Void> error(String code, String message, int status) {
        return error(code, message, status, null);
    }

    public static ApiResponse<Void> error(String code, String message, int status,
                                          Map<String, String> erreurs) {
        return ApiResponse.<Void>builder()
            .success(false)
            .status(status)
            .code(code)
            .message(message)
            .erreurs(erreurs)
            .timestamp(System.currentTimeMillis())
            .build();
    }
}
