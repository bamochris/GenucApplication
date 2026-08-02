package cd.genuc.exception;

/**
 * Exception levée quand un paiement n'existe pas
 */
public class PaiementNotFoundException extends RuntimeException {
    private final Long paiementId;

    public PaiementNotFoundException(Long id) {
        super("Paiement non trouvé : id=" + id);
        this.paiementId = id;
    }

    public PaiementNotFoundException(String reference) {
        super("Paiement non trouvé : ref=" + reference);
        this.paiementId = null;
    }

    public Long getPaiementId() {
        return paiementId;
    }
}
