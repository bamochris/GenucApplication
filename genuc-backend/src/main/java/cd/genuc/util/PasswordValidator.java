package cd.genuc.util;

import java.util.ArrayList;
import java.util.List;

public final class PasswordValidator {

    private static final int MIN_LENGTH = 8;

    private PasswordValidator() {
    }

    public static ValidationResult validate(String password) {
        List<String> erreurs = new ArrayList<>();

        if (password == null || password.isBlank()) {
            erreurs.add("Le mot de passe est requis");
            return new ValidationResult(false, erreurs);
        }

        if (password.length() < MIN_LENGTH) {
            erreurs.add("Le mot de passe doit contenir au moins " + MIN_LENGTH + " caractères");
        }

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
            else hasSpecial = true;
        }

        if (!hasUpper) {
            erreurs.add("Le mot de passe doit contenir au moins une lettre majuscule");
        }
        if (!hasLower) {
            erreurs.add("Le mot de passe doit contenir au moins une lettre minuscule");
        }
        if (!hasDigit) {
            erreurs.add("Le mot de passe doit contenir au moins un chiffre");
        }
        if (!hasSpecial) {
            erreurs.add("Le mot de passe doit contenir au moins un caractère spécial");
        }

        return new ValidationResult(erreurs.isEmpty(), erreurs);
    }

    public static class ValidationResult {
        private final boolean valide;
        private final List<String> erreurs;

        public ValidationResult(boolean valide, List<String> erreurs) {
            this.valide = valide;
            this.erreurs = erreurs;
        }

        public boolean estValide() {
            return valide;
        }

        public List<String> getErreurs() {
            return erreurs;
        }
    }
}