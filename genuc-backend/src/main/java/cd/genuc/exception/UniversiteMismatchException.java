package cd.genuc.exception;

/**
 * Exception levée quand une inscription n'appartient pas à l'université spécifiée
 */
public class UniversiteMismatchException extends RuntimeException {
    private final Long inscriptionId;
    private final Long universiteId;

    public UniversiteMismatchException(Long inscriptionId, Long universiteId) {
        super("Cette inscription ne correspond pas à cette université");
        this.inscriptionId = inscriptionId;
        this.universiteId = universiteId;
    }

    public Long getInscriptionId() {
        return inscriptionId;
    }

    public Long getUniversiteId() {
        return universiteId;
    }
}