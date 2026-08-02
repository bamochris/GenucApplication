package cd.genuc.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Protège les endpoints d'authentification contre le brute-force.
 * Après MAX_ATTEMPTS échecs consécutifs, le compte est verrouillé LOCKOUT_DURATION minutes.
 * Les compteurs sont stockés dans Redis pour être partagés entre instances.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final StringRedisTemplate redisTemplate;

    private static final int      MAX_ATTEMPTS    = 10;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(5);
    private static final String   KEY_PREFIX       = "login:attempts:";
    private static final String   LOCK_PREFIX      = "login:locked:";

    public void loginReussi(String email) {
        try {
            redisTemplate.delete(KEY_PREFIX + email);
        } catch (Exception e) {
            log.debug("Redis indisponible - impossible de réinitialiser les tentatives pour : {}", email);
        }
    }

    public void loginEchoue(String email) {
        try {
            String key = KEY_PREFIX + email;
            Long tentatives = redisTemplate.opsForValue().increment(key);
            if (tentatives == 1) {
                redisTemplate.expire(key, LOCKOUT_DURATION);
            }
            if (tentatives != null && tentatives >= MAX_ATTEMPTS) {
                redisTemplate.opsForValue().set(LOCK_PREFIX + email, "locked", LOCKOUT_DURATION);
                log.warn("Compte verrouillé après {} échecs : {}", MAX_ATTEMPTS, email);
            }
        } catch (Exception e) {
            log.debug("Redis indisponible - impossible d'enregistrer l'échec de connexion pour : {}", email);
        }
    }

    public boolean estVerrouille(String email) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(LOCK_PREFIX + email));
        } catch (Exception e) {
            log.debug("Redis indisponible - compte non verrouillé par défaut : {}", email);
            return false;
        }
    }

    public int tentativesRestantes(String email) {
        try {
            String val = redisTemplate.opsForValue().get(KEY_PREFIX + email);
            int tentatives = val == null ? 0 : Integer.parseInt(val);
            return Math.max(0, MAX_ATTEMPTS - tentatives);
        } catch (Exception e) {
            return MAX_ATTEMPTS;
        }
    }
}
