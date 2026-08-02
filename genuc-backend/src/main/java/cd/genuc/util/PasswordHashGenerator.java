package cd.genuc.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // Liste des mots de passe à hasher
        String[] passwords = {
            "Genuc2024!",
            "Admin123!",
            "Recteur123!",
            "Prof123!",
            "Chef123!",
            "Caisse123!",
            "Biblio123!",
            "Etudiant123!",
            "Secretaire123!",
            "Appariteur123!",
            "RH123!",
            "Comptable123!",
            "Social123!"
        };

        for (String pwd : passwords) {
            System.out.println(pwd + " -> " + encoder.encode(pwd));
        }
    }
}