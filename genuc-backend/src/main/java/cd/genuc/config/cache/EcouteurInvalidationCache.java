package cd.genuc.config.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;

import java.nio.charset.StandardCharsets;

/**
 * Applique les invalidations de cache local diffusées par les autres instances.
 *
 * <p>Le message est relu vers un type figé ({@link MessageInvalidationCache}), sans typage
 * polymorphique : un message forgé ne peut donc pas provoquer l'instanciation d'une classe
 * arbitraire. Sa taille est bornée avant analyse, et toute charge invalide est ignorée.</p>
 */
@Slf4j
@RequiredArgsConstructor
public class EcouteurInvalidationCache implements MessageListener {

    /** Un message légitime fait quelques centaines d'octets ; au-delà, on jette. */
    private static final int TAILLE_MAX = 4096;

    private final GestionnaireCacheDeuxNiveaux gestionnaire;
    private final PublicateurInvalidationCache publicateur;
    private final ObjectMapper mapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        byte[] corps = message.getBody();
        if (corps == null || corps.length == 0 || corps.length > TAILLE_MAX) {
            return;
        }
        try {
            MessageInvalidationCache invalidation =
                    mapper.readValue(new String(corps, StandardCharsets.UTF_8), MessageInvalidationCache.class);

            if (invalidation.cache() == null || publicateur.noeud().equals(invalidation.noeud())) {
                return; // message de cette instance : le niveau 1 est déjà à jour
            }
            if (!CacheNames.PAR_NOM.containsKey(invalidation.cache())) {
                return; // nom de cache inconnu : rien à invalider
            }
            gestionnaire.invaliderNiveau1(invalidation.cache(), invalidation.cle());

        } catch (Exception e) {
            log.debug("Message d'invalidation de cache ignoré (illisible) : {}", e.getMessage());
        }
    }
}
