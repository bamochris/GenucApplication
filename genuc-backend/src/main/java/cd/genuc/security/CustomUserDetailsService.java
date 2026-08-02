package cd.genuc.security;

import cd.genuc.model.Utilisateur;
import cd.genuc.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé: " + email));
        
        if (!utilisateur.isCompteActive()) {
            throw new UsernameNotFoundException("Compte non activé. Veuillez activer votre compte via l'email reçu.");
        }
        
        // ✅ Retourne directement l'entité Utilisateur (qui implémente UserDetails)
        return utilisateur;
    }
}