package cd.genuc.exception;

/**
 * Exception levée quand une inscription n'existe pas
 */
public class InscriptionNotFoundException extends RuntimeException {
    private final Long inscriptionId;

    public InscriptionNotFoundException(Long id) {
        super("Inscription non trouvée : id=" + id);
        this.inscriptionId = id;
    }

    public InscriptionNotFoundException(String message) {
        super(message);
        this.inscriptionId = null;
    }

    public Long getInscriptionId() {
        return inscriptionId;
    }
}
