package cd.genuc.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.Map;

/**
 * Configure deux pools Hikari distincts :
 *   - primaryDataSource  : lecture + écriture
 *   - replicaDataSource  : lecture seule
 *
 * Le RoutingDataSource sélectionne automatiquement le bon pool selon
 * @Transactional(readOnly = true) — aucune modification du code métier.
 *
 * En développement, la replica pointe sur le même serveur que le primary
 * (REPLICA_URL == DB_URL). En production, pointer sur un vrai replica PostgreSQL.
 *
 * <p><b>Dimensionnement.</b> Les pools demandaient 200 connexions (primary, via
 * application.yml) plus 50 (replica). PostgreSQL en accepte 100 au total par défaut
 * (<code>max_connections</code>) : sous charge, la moitié des acquisitions échouait en
 * <code>connection timeout</code> — et une base saturée de connexions inactives est plus lente,
 * pas plus rapide. Un pool ne doit pas dimensionner la concurrence applicative mais le
 * parallélisme réel de la base ; quelques dizaines de connexions suffisent, la file d'attente
 * devant le pool absorbe les pointes. Les valeurs restent surchargeables par variables
 * d'environnement (<code>DB_POOL_SIZE</code>, <code>DB_REPLICA_POOL_SIZE</code>) pour un
 * serveur dont <code>max_connections</code> a été relevé.</p>
 */
@Configuration
public class DataSourceConfig {

    // ─── Primary (lecture + écriture) ──────────────────────────────────
    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/genuc_db}")
    private String primaryUrl;

    @Value("${spring.datasource.username:genuc_user}")
    private String primaryUsername;

    @Value("${spring.datasource.password}")
    private String primaryPassword;

    // Configurable pour permettre H2 dans les tests (profil test) ;
    // défaut inchangé : PostgreSQL.
    @Value("${spring.datasource.driverClassName:org.postgresql.Driver}")
    private String driverClassName;

    // ─── Replica (lecture seule) ────────────────────────────────────────
    @Value("${spring.datasource.replica.url:${spring.datasource.url:jdbc:postgresql://localhost:5432/genuc_db}}")
    private String replicaUrl;

    @Value("${spring.datasource.replica.username:${spring.datasource.username:genuc_user}}")
    private String replicaUsername;

    @Value("${spring.datasource.replica.password:${spring.datasource.password}}")
    private String replicaPassword;

    // ─── Hikari tuning ──────────────────────────────────────────────────
    @Value("${spring.datasource.hikari.maximum-pool-size:30}")
    private int primaryPoolSize;

    @Value("${spring.datasource.hikari.replica.maximum-pool-size:15}")
    private int replicaPoolSize;

    /**
     * Connexions gardées ouvertes au repos. Volontairement bas : une connexion inactive
     * consomme un backend PostgreSQL complet, et Hikari en ouvre une nouvelle en quelques
     * millisecondes quand la charge monte.
     */
    @Value("${spring.datasource.hikari.minimum-idle:5}")
    private int minimumIdle;

    @Value("${spring.datasource.hikari.replica.minimum-idle:2}")
    private int replicaMinimumIdle;

    @Bean
    public DataSource primaryDataSource() {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(primaryUrl);
        cfg.setUsername(primaryUsername);
        cfg.setPassword(primaryPassword);
        cfg.setDriverClassName(driverClassName);
        cfg.setPoolName("GenucPrimaryPool");
        cfg.setMaximumPoolSize(primaryPoolSize);
        cfg.setMinimumIdle(minimumIdle);
        cfg.setConnectionTimeout(20_000);
        cfg.setIdleTimeout(600_000);
        cfg.setMaxLifetime(1_800_000);
        cfg.setLeakDetectionThreshold(60_000);
        cfg.setConnectionTestQuery("SELECT 1");
        // Batch inserts/updates pour Hibernate
        cfg.addDataSourceProperty("reWriteBatchedInserts", "true");
        cfg.addDataSourceProperty("cachePrepStmts", "true");
        cfg.addDataSourceProperty("prepStmtCacheSize", "250");
        cfg.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        return new HikariDataSource(cfg);
    }

    @Bean
    public DataSource replicaDataSource() {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(replicaUrl);
        cfg.setUsername(replicaUsername);
        cfg.setPassword(replicaPassword);
        cfg.setDriverClassName(driverClassName);
        cfg.setPoolName("GenucReplicaPool");
        cfg.setMaximumPoolSize(replicaPoolSize);
        cfg.setMinimumIdle(replicaMinimumIdle);
        cfg.setConnectionTimeout(20_000);
        cfg.setIdleTimeout(600_000);
        cfg.setMaxLifetime(1_800_000);
        cfg.setConnectionTestQuery("SELECT 1");
        cfg.setReadOnly(true);
        cfg.addDataSourceProperty("reWriteBatchedInserts", "false");
        cfg.addDataSourceProperty("cachePrepStmts", "true");
        cfg.addDataSourceProperty("prepStmtCacheSize", "250");
        cfg.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        return new HikariDataSource(cfg);
    }

    @Bean
    @Primary
    public DataSource routingDataSource() {
        RoutingDataSource routing = new RoutingDataSource();
        routing.setTargetDataSources(Map.of(
            RoutingDataSource.PRIMARY, primaryDataSource(),
            RoutingDataSource.REPLICA, replicaDataSource()
        ));
        routing.setDefaultTargetDataSource(primaryDataSource());
        routing.afterPropertiesSet();
        return routing;
    }
}
