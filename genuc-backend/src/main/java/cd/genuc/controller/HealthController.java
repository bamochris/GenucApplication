package cd.genuc.controller;

import cd.genuc.repository.UniversiteRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Contrôleur de santé personnalisé pour surveiller l'état de l'application
 */
@RestController
@RequestMapping("/actuator/custom-health")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Health", description = "Contrôle de santé personnalisé")
public class HealthController {

    private final DataSource dataSource;
    private final UniversiteRepository universiteRepository;

    // ✅ Rendu optionnel car Redis peut ne pas être présent en environnement local
    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @GetMapping
    @Operation(summary = "Vérifier l'état de l'application", description = "Retourne le statut de la DB, Redis et le nombre d'universités")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("timestamp", LocalDateTime.now().toString());
        status.put("application", "GENUC Platform");
        status.put("version", "1.0.0");

        // ─── Vérification de la base de données ──────────────
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(2)) {
                status.put("database", "✅ OK");
            } else {
                status.put("database", "❌ Invalid connection");
            }
        } catch (Exception e) {
            log.error("Erreur de connexion à la base de données", e);
            status.put("database", "❌ " + e.getMessage());
        }

        // ─── Vérification du cache Redis (si disponible) ──────
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set("health-check", "OK");
                String value = redisTemplate.opsForValue().get("health-check");
                if ("OK".equals(value)) {
                    status.put("redis", "✅ OK");
                } else {
                    status.put("redis", "❌ Incorrect response");
                }
            } catch (Exception e) {
                log.warn("Erreur de connexion à Redis", e);
                status.put("redis", "⚠️ " + e.getMessage());
            }
        } else {
            status.put("redis", "⚠️ Non configuré");
        }

        // ─── Nombre d'universités ─────────────────────────────
        try {
            long count = universiteRepository.count();
            status.put("universites", count);
        } catch (Exception e) {
            status.put("universites", "❌ " + e.getMessage());
        }

        // ─── Statut global ─────────────────────────────────────
        boolean allOk = "✅ OK".equals(status.get("database")) &&
                        ("✅ OK".equals(status.get("redis")) || "⚠️ Non configuré".equals(status.get("redis")));
        status.put("status", allOk ? "UP" : "DOWN");

        HttpStatus httpStatus = allOk ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(httpStatus).body(status);
    }

    @GetMapping("/ping")
    @Operation(summary = "Ping simple", description = "Retourne un pong pour vérifier que l'API est accessible")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of(
                "pong", LocalDateTime.now().toString(),
                "message", "GENUC API is alive"
        ));
    }
}