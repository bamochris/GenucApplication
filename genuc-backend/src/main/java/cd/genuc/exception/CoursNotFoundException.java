package cd.genuc.exception;

/**
 * Exception levée quand un cours n'existe pas
 */
public class CoursNotFoundException extends RuntimeException {
    private final Long coursId;

    public CoursNotFoundException(Long id) {
        super("Cours introuvable : id=" + id);
        this.coursId = id;
    }

    public Long getCoursId() {
        return coursId;
    }
}