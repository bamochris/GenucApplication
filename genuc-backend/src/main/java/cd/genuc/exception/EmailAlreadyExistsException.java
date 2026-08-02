package cd.genuc.exception;

/**
 * Exception levée quand un email est déjà utilisé
 */
public class EmailAlreadyExistsException extends RuntimeException {
    private final String email;

    public EmailAlreadyExistsException(String email) {
        super("Un compte existe déjà avec cet email : " + email);
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}
