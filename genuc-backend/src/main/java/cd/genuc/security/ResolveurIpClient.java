package cd.genuc.security;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Détermine l'adresse IP réelle du client, sans faire aveuglément confiance aux
 * en-têtes de proxy.
 *
 * <p>{@code X-Forwarded-For} et {@code X-Real-IP} sont de simples en-têtes HTTP :
 * n'importe quel client peut les inventer. Tant qu'on les lisait sans condition,
 * deux protections tombaient :</p>
 * <ul>
 *   <li>le <b>rate limiting</b> — il suffisait de changer d'{@code X-Forwarded-For}
 *       à chaque tentative pour repartir d'un compteur neuf, donc pour tenter un
 *       bruteforce de connexion sans jamais atteindre la limite ;</li>
 *   <li>la <b>whitelist IP des webhooks TachPay</b> — un appelant direct pouvait se
 *       présenter avec l'IP d'un opérateur mobile money.</li>
 * </ul>
 *
 * <p>Ces en-têtes ne sont donc lus que si la connexion provient réellement d'un
 * proxy déclaré de confiance ({@code genuc.proxy.trusted}). Sinon, seule l'adresse
 * de la socket TCP ({@code getRemoteAddr()}), non falsifiable, fait foi.</p>
 *
 * <p>Le défaut couvre les plages privées : dans le déploiement type (Nginx en frontal
 * sur le réseau Docker), le reverse proxy a une IP privée et ses en-têtes sont donc
 * honorés, tandis qu'un attaquant venant d'Internet a une IP publique et voit ses
 * en-têtes ignorés. <b>Si le backend est exposé directement, mettre la propriété à
 * vide</b> pour ne jamais faire confiance à un en-tête.</p>
 */
@Slf4j
@Component
public class ResolveurIpClient {

    @Value("${genuc.proxy.trusted:127.0.0.1/32,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16}")
    private String proxiesDeConfiance;

    private final List<PlageIp> plages = new ArrayList<>();

    @PostConstruct
    void initialiser() {
        if (proxiesDeConfiance != null && !proxiesDeConfiance.isBlank()) {
            Arrays.stream(proxiesDeConfiance.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(this::ajouterPlage);
        }
        if (plages.isEmpty()) {
            log.info("ResolveurIpClient : aucun proxy de confiance — les en-têtes "
                    + "X-Forwarded-For / X-Real-IP seront TOUJOURS ignorés.");
        } else {
            log.info("ResolveurIpClient : {} plage(s) de proxy de confiance configurée(s).", plages.size());
        }
    }

    /** @return l'IP client à utiliser pour le rate limiting, la whitelist et les logs. */
    public String resoudre(HttpServletRequest request) {
        String adresseSocket = request.getRemoteAddr();

        if (!estProxyDeConfiance(adresseSocket)) {
            return adresseSocket;
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // Le premier élément est le client d'origine ; les suivants sont les proxies
            // traversés. On ne garde que le premier, et seulement s'il est exploitable.
            String premier = forwarded.split(",")[0].trim();
            if (!premier.isEmpty() && !"unknown".equalsIgnoreCase(premier)) {
                return premier;
            }
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && !"unknown".equalsIgnoreCase(realIp)) {
            return realIp.trim();
        }

        return adresseSocket;
    }

    /** @return true si l'adresse appartient à une plage de proxies déclarée de confiance. */
    public boolean estProxyDeConfiance(String adresse) {
        if (adresse == null || adresse.isBlank() || plages.isEmpty()) {
            return false;
        }
        byte[] octets = versOctets(adresse);
        if (octets == null) {
            return false;
        }
        return plages.stream().anyMatch(p -> p.contient(octets));
    }

    // ══════════════════════════════════════════
    // Interne
    // ══════════════════════════════════════════

    private void ajouterPlage(String entree) {
        try {
            String adresse = entree;
            int bitsPrefixe = -1;
            int slash = entree.indexOf('/');
            if (slash >= 0) {
                adresse = entree.substring(0, slash);
                bitsPrefixe = Integer.parseInt(entree.substring(slash + 1).trim());
            }
            byte[] octets = versOctets(adresse);
            if (octets == null) {
                log.warn("genuc.proxy.trusted : entrée ignorée (adresse illisible) « {} »", entree);
                return;
            }
            if (bitsPrefixe < 0) {
                bitsPrefixe = octets.length * 8; // adresse seule = /32 (ou /128 en IPv6)
            }
            plages.add(new PlageIp(octets, bitsPrefixe));
        } catch (NumberFormatException e) {
            log.warn("genuc.proxy.trusted : entrée ignorée (préfixe invalide) « {} »", entree);
        }
    }

    private byte[] versOctets(String adresse) {
        try {
            // Une adresse IPv6 peut arriver entre crochets ou suffixée d'un scope.
            String nettoyee = adresse.replace("[", "").replace("]", "");
            int pourcent = nettoyee.indexOf('%');
            if (pourcent > 0) {
                nettoyee = nettoyee.substring(0, pourcent);
            }
            return InetAddress.getByName(nettoyee).getAddress();
        } catch (UnknownHostException | SecurityException e) {
            return null;
        }
    }

    /** Plage CIDR, comparée bit à bit — fonctionne en IPv4 comme en IPv6. */
    private record PlageIp(byte[] reseau, int bitsPrefixe) {

        boolean contient(byte[] adresse) {
            if (adresse.length != reseau.length) {
                return false; // on ne compare pas une IPv4 à une IPv6
            }
            int octetsPleins = bitsPrefixe / 8;
            int bitsRestants = bitsPrefixe % 8;

            for (int i = 0; i < octetsPleins; i++) {
                if (adresse[i] != reseau[i]) {
                    return false;
                }
            }
            if (bitsRestants == 0) {
                return true;
            }
            int masque = (0xFF00 >> bitsRestants) & 0xFF;
            return (adresse[octetsPleins] & masque) == (reseau[octetsPleins] & masque);
        }
    }
}
