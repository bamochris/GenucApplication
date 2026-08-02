package cd.genuc.config;

import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Beans TOTP pour {@link cd.genuc.service.TwoFactorService}.
 *
 * totp-spring-boot-starter (1.7.1) enregistre son auto-configuration via l'ancien mécanisme
 * {@code META-INF/spring.factories} — retiré par Spring Boot 3.x (qui ne lit que
 * {@code META-INF/spring/...AutoConfiguration.imports}). L'auto-configuration de la
 * dépendance ne s'active donc jamais silencieusement ; ces beans doivent être déclarés à la
 * main, à l'identique de ce que {@code TotpAutoConfiguration} ferait.
 */
@Configuration
public class TotpConfig {

    @Bean
    public SecretGenerator secretGenerator() {
        return new DefaultSecretGenerator();
    }

    @Bean
    public QrGenerator qrGenerator() {
        return new ZxingPngQrGenerator();
    }

    @Bean
    public TimeProvider timeProvider() {
        return new SystemTimeProvider();
    }

    @Bean
    public CodeVerifier codeVerifier(TimeProvider timeProvider) {
        return new DefaultCodeVerifier(new DefaultCodeGenerator(), timeProvider);
    }
}
