package cd.genuc.exception;

/**
 * Exception levée quand un utilisateur n'existe pas
 */
public class UtilisateurNotFoundException extends RuntimeException {
    private final String email;

    public UtilisateurNotFoundException(String email) {
        super("Utilisateur non trouvé : " + email);
        this.email = email;
    }

    public UtilisateurNotFoundException(Long id) {
        super("Utilisateur non trouvé : id=" + id);
        this.email = null;
    }

    public String getEmail() {
        return email;
    }
}
