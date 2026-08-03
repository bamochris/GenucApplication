package cd.genuc;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;

/**
 * Socle des tests d'intégration @SpringBootTest.
 *
 * Démarre UN conteneur PostgreSQL 15 partagé pour toute la JVM de test
 * (même image qu'en production — indispensable : les entités utilisent des
 * types PostgreSQL comme JSONB que H2 ne sait pas créer) et pointe les deux
 * pools du RoutingDataSource (primaire + réplica) dessus.
 *
 * <h2>Pourquoi le démarrage est protégé</h2>
 *
 * <p>Le conteneur était auparavant démarré par un {@code static { POSTGRES.start(); }}
 * nu. Un bloc d'initialisation statique qui lève une exception empoisonne la classe
 * pour toute la durée de la JVM : le premier accès échoue sur
 * {@code ExceptionInInitializerError}, et <b>tous les suivants sur
 * {@code NoClassDefFoundError}</b>, sans la cause d'origine.</p>
 *
 * <p>C'est ce qui rendait les échecs illisibles. Un hoquet de Docker au milieu
 * d'une exécution complète faisait remonter, bien plus loin, un
 * « No qualifying bean of type 'UtilisateurRepository' » dépourvu de tout
 * {@code Caused by} — alors que le motif réel était que la base n'avait jamais
 * démarré. Les mêmes classes passaient ensuite sans broncher en isolation, ce qui
 * achevait de brouiller le diagnostic.</p>
 *
 * <p>{@code @Testcontainers(disabledWithoutDocker = true)} ne pouvait pas
 * l'empêcher : cette condition est évaluée par JUnit, alors que le bloc statique
 * s'exécute au chargement de la classe. La disponibilité de Docker est donc
 * vérifiée ici, explicitement, avant toute tentative de démarrage.</p>
 */
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    /**
     * Évalué une seule fois : sonder Docker coûte quelques centaines de
     * millisecondes et le résultat ne change pas en cours d'exécution.
     */
    private static final boolean DOCKER_DISPONIBLE = detecterDocker();

    // Conteneur statique démarré une seule fois et partagé entre toutes les
    // classes de test qui héritent de cette base (pattern singleton container).
    static final PostgreSQLContainer<?> POSTGRES =
        new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("genuc_test")
            .withUsername("genuc_test")
            .withPassword("genuc_test")
            // Sans délai explicite, un démarrage lent se solde par un échec
            // tardif et obscur plutôt que par un message clair. Trois minutes
            // couvrent largement le premier téléchargement de l'image.
            .withStartupTimeout(Duration.ofMinutes(3))
            // Réutilise le conteneur d'une exécution à l'autre au lieu d'en
            // recréer un — le démarrage coûtait à lui seul plus de deux minutes.
            // Sans effet tant que `testcontainers.reuse.enable=true` n'est pas
            // présent dans ~/.testcontainers.properties : Testcontainers se
            // contente alors d'un avertissement.
            .withReuse(true);

    static {
        if (DOCKER_DISPONIBLE) {
            POSTGRES.start();
        }
    }

    private static boolean detecterDocker() {
        try {
            return DockerClientFactory.instance().isDockerAvailable();
        } catch (RuntimeException e) {
            // Docker injoignable : `disabledWithoutDocker` désactivera les
            // tests, inutile de faire échouer le chargement de la classe.
            return false;
        }
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        if (!DOCKER_DISPONIBLE) {
            // Les tests sont désactivés : ne rien enregistrer évite d'appeler
            // getJdbcUrl() sur un conteneur qui n'a jamais démarré.
            return;
        }
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
