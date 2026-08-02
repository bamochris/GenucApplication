package cd.genuc.exception;

/**
 * Panne d'un opérateur de paiement externe (Mobile Money, Stripe) : appel réseau
 * échoué, réponse HTTP d'erreur, timeout, réponse illisible.
 *
 * <p>Type dédié pour distinguer une VRAIE panne opérateur (transitoire, à compter
 * par le circuit breaker) d'une erreur de configuration ou de validation métier
 * (permanente, à ne PAS compter). Voir {@code resilience4j.circuitbreaker} dans
 * {@code application.yml} : seule cette exception figure dans {@code record-exceptions}.</p>
 */
public class OperateurPaiementException extends RuntimeException {

    private final String operateur;

    public OperateurPaiementException(String operateur, String message, Throwable cause) {
        super(message, cause);
        this.operateur = operateur;
    }

    public OperateurPaiementException(String operateur, String message) {
        super(message);
        this.operateur = operateur;
    }

    public String getOperateur() {
        return operateur;
    }
}
