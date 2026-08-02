package cd.genuc.service;

import cd.genuc.model.AuditLog;
import cd.genuc.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void logAction(String action, String entityType, Long entityId,
                          String oldValue, String newValue, Long userId, String userEmail,
                          Boolean success, String errorMessage, String module, Long durationMs) {
        String ip = getClientIp();
        String userAgent = getUserAgent();

        AuditLog log = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .userId(userId)
                .userEmail(userEmail)
                .ipAddress(ip)
                .userAgent(userAgent)
                .success(success)
                .errorMessage(errorMessage)
                .module(module)
                .durationMs(durationMs)
                .build();

        auditLogRepository.save(log);
    }

    // Surcharge pour les cas simples
    public void logAction(String action, String entityType, Long entityId, Long userId, String userEmail) {
        logAction(action, entityType, entityId, null, null, userId, userEmail, true, null, null, null);
    }

    public void logConnexion(String email, boolean success, String errorMessage) {
        Long userId = null;
        // On pourrait chercher l'utilisateur par email, mais on ne le fait pas ici pour éviter une requête inutile
        // On laisse userId null pour les échecs, ou on le récupère si succès
        logAction("LOGIN", "Connexion", null, null, null, null, email, success, errorMessage, "AUTH", null);
    }

    private String getClientIp() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) return "unknown";
        HttpServletRequest request = attributes.getRequest();
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String getUserAgent() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) return "unknown";
        HttpServletRequest request = attributes.getRequest();
        return request.getHeader("User-Agent");
    }
}