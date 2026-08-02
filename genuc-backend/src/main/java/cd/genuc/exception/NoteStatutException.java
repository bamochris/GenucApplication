package cd.genuc.exception;

/**
 * Exception levée quand une opération n'est pas autorisée sur l'état actuel d'une note
 */
public class NoteStatutException extends RuntimeException {
    private final String statutActuel;
    private final String operation;

    public NoteStatutException(String statutActuel, String operation) {
        super("L'opération '" + operation + "' n'est pas autorisée sur une note avec le statut: " + statutActuel);
        this.statutActuel = statutActuel;
        this.operation = operation;
    }

    public String getStatutActuel() {
        return statutActuel;
    }

    public String getOperation() {
        return operation;
    }
}