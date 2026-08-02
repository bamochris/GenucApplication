package cd.genuc.service;

import cd.genuc.model.AuditLog;
import cd.genuc.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String action, String entityType, Long entityId,
                    String oldValue, String newValue,
                    Long userId, String userEmail,
                    String ipAddress, String userAgent,
                    Boolean success, String errorMessage,
                    String module, Long durationMs) {

        AuditLog logEntry = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .userId(userId)
                .userEmail(userEmail)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .success(success != null ? success : true)
                .errorMessage(errorMessage)
                .module(module)
                .durationMs(durationMs)
                .createdAt(LocalDateTime.now())
                .build();

        auditLogRepository.save(logEntry);
    }

    // Méthodes simplifiées pour les cas courants

    public void logAction(String action, String entityType, Long entityId, String details, Long userId) {
        log(action, entityType, entityId, null, details, userId, null, null, null, true, null, null, null);
    }

    public void logModification(String entityType, Long entityId, String oldValue, String newValue, Long userId) {
        log("UPDATE", entityType, entityId, oldValue, newValue, userId, null, null, null, true, null, null, null);
    }

    public void logValidation(String entityType, Long entityId, String details, Long userId) {
        log("VALIDATE", entityType, entityId, null, details, userId, null, null, null, true, null, null, null);
    }
}