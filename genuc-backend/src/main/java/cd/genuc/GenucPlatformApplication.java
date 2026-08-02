package cd.genuc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.core.env.Environment;

@SpringBootApplication(scanBasePackages = "cd.genuc")
@EnableJpaRepositories(basePackages = "cd.genuc.repository")
@EntityScan(basePackages = "cd.genuc.model")
@EnableCaching
@EnableScheduling
public class GenucPlatformApplication {

    public static void main(String[] args) {
        System.setProperty("spring.devtools.restart.enabled", "false");
        SpringApplication app = new SpringApplication(GenucPlatformApplication.class);
        if (System.getProperty("spring.profiles.active") == null
            && System.getenv("SPRING_PROFILES_ACTIVE") == null
            && System.getenv("ACTIVE_PROFILE") == null) {
            app.setAdditionalProfiles("dev");
        }
        Environment env = app.run(args).getEnvironment();
        printBanner(env);
    }

    private static void printBanner(Environment env) {
        String port = env.getProperty("server.port", "8082");
        System.out.println("\n");
        System.out.println("╔══════════════════════════════════════════╗");
        System.out.println("║   GENUC Platform - Démarré avec succès   ║");
        System.out.println("║   API disponible : http://localhost:" + port + " ║");
        System.out.println("║   Cache & Scheduling activés             ║");
        System.out.println("╚══════════════════════════════════════════╝");
        System.out.println("\n");
    }
}