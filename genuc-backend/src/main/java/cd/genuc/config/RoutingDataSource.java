package cd.genuc.config;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Redirige automatiquement les requêtes SQL :
 *  - @Transactional(readOnly = true)  →  replica (lecture seule, scalable)
 *  - @Transactional / sans annotation →  primary (écriture)
 *
 * Fonctionne avec tous les services qui utilisent déjà @Transactional(readOnly = true).
 * Aucune modification de code métier nécessaire.
 */
public class RoutingDataSource extends AbstractRoutingDataSource {

    public static final String PRIMARY = "primary";
    public static final String REPLICA = "replica";

    @Override
    protected Object determineCurrentLookupKey() {
        return TransactionSynchronizationManager.isCurrentTransactionReadOnly()
                ? REPLICA
                : PRIMARY;
    }
}
