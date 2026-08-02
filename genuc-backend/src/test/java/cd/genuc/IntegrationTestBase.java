package cd.genuc;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Socle des tests d'intégration @SpringBootTest.
 *
 * Démarre UN conteneur PostgreSQL 15 partagé pour toute la JVM de test
 * (même image qu'en production — indispensable : les entités utilisent des
 * types PostgreSQL comme JSONB que H2 ne sait pas créer) et pointe les deux
 * pools du RoutingDataSource (primaire + réplica) dessus.
 *
 * disabledWithoutDocker = true : sans Docker, ces tests sont SKIPPÉS au lieu
 * d'échouer — mvn test reste vert sur une machine sans Docker.
 */
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    // Conteneur statique démarré une seule fois et partagé entre toutes les
    // classes de test qui héritent de cette base (pattern singleton container).
    static final PostgreSQLContainer<?> POSTGRES =
        new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("genuc_test")
            .withUsername("genuc_test")
            .withPassword("genuc_test");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.datasource.driverClassName", () -> "org.postgresql.Driver");
        registry.add("spring.datasource.replica.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.replica.username", POSTGRES::getUsername);
        registry.add("spring.datasource.replica.password", POSTGRES::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.database-platform",
            () -> "org.hibernate.dialect.PostgreSQLDialect");
    }
}
