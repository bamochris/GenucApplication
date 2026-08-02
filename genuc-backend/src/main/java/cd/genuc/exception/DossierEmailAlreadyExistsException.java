package cd.genuc.exception;

/**
 * Exception levée quand un dossier d'inscription existe déjà avec cet email
 */
public class DossierEmailAlreadyExistsException extends RuntimeException {
    private final String email;

    public DossierEmailAlreadyExistsException(String email) {
        super("Un dossier existe déjà avec cet email: " + email);
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}