package cd.genuc.exception;

/**
 * Exception levée quand une note n'existe pas
 */
public class NoteNotFoundException extends RuntimeException {
    private final Long noteId;

    public NoteNotFoundException(Long id) {
        super("Note introuvable : id=" + id);
        this.noteId = id;
    }

    public Long getNoteId() {
        return noteId;
    }
}