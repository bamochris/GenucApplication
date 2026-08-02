package cd.genuc.exception;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Classe pour structurer les erreurs API
 */
@Data
@AllArgsConstructor
public class ErrorResponse {
    private String code;           // ex: "INSCRIPTION_NOT_FOUND"
    private String message;        // Message lisible
    private int status;            // HTTP status code
    private long timestamp;        // Timestamp de l'erreur
}
