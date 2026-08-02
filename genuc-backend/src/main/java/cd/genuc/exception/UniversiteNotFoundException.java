package cd.genuc.exception;

/**
 * Exception levée quand une université n'existe pas
 */
public class UniversiteNotFoundException extends RuntimeException {
    private final Long universiteId;

    public UniversiteNotFoundException(Long id) {
        super("Université non trouvée : id=" + id);
        this.universiteId = id;
    }

    public Long getUniversiteId() {
        return universiteId;
    }
}
