package cd.genuc.exception;

/**
 * Exception levée quand un examen n'existe pas
 */
public class ExamenNotFoundException extends RuntimeException {
    private final Long examenId;

    public ExamenNotFoundException(Long id) {
        super("Examen introuvable : id=" + id);
        this.examenId = id;
    }

    public Long getExamenId() {
        return examenId;
    }
}