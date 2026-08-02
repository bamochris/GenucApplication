package cd.genuc.exception;

/**
 * Exception levée quand les identifiants sont invalides.
 *
 * <p>{@code exposable} indique si {@link #getMessage()} peut être renvoyé tel quel
 * au client. Le constructeur à un seul argument produit un message interne
 * (contenant l'email) qui ne doit jamais être exposé — le client reçoit alors un
 * message générique. Le constructeur à deux arguments porte un message déjà
 * rédigé pour l'utilisateur (ex. « compte verrouillé ») et est donc exposable.</p>
 */
public class InvalidCredentialsException extends RuntimeException {
    private final String email;
    private final boolean exposable;

    public InvalidCredentialsException(String email) {
        super("Identifiants invalides pour : " + email);
        this.email = email;
        this.exposable = false;
    }

    public InvalidCredentialsException(String email, String message) {
        super(message);
        this.email = email;
        this.exposable = true;
    }

    public String getEmail() {
        return email;
    }

    public boolean isExposable() {
        return exposable;
    }
}
