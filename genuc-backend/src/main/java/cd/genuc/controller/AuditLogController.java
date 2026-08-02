// src/main/java/cd/genuc/controller/AuditLogController.java
package cd.genuc.controller;

import cd.genuc.model.AuditLog;
import cd.genuc.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Consultation des journaux d'audit pour le tableau de bord
 * « Administration Système ». Le frontend appelait déjà ces routes
 * (AdministrateurSystemeDashboard.jsx) sans qu'aucun contrôleur n'existe :
 * chaque visite du dashboard générait des erreurs 500 en console.
 */
@RestController
@RequestMapping("/api/audit/logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_SYSTEME')")
    public ResponseEntity<?> stats() {
        long totalLogs = auditLogRepository.count();
        long totalConnexions = auditLogRepository.countConnexions();
        long echecs = auditLogRepository.countEchecsConnexion();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalLogs", totalLogs);
        stats.put("totalConnexions", totalConnexions);
        stats.put("echecsConnexion", echecs);
        stats.put("tauxEchec", totalConnexions > 0 ? Math.round(echecs * 100.0 / totalConnexions) : 0);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/connexions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_SYSTEME')")
    public ResponseEntity<List<AuditLog>> connexions(@RequestParam(defaultValue = "10") int limit) {
        int taille = Math.min(Math.max(limit, 1), 100);
        return ResponseEntity.ok(
                auditLogRepository.findByActionOrderByCreatedAtDesc("LOGIN", PageRequest.of(0, taille)));
    }
}
