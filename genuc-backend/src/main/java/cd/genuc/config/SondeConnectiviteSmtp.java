package cd.genuc.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.UnknownHostException;

/**
 * Sonde de connectivité SMTP, exécutée une fois au démarrage.
 *
 * <p>Motif : en production, tout envoi échouait sur
 * {@code MailConnectException: Couldn't connect to host, port: smtp.gmail.com, 587}.
 * Un échec d'ouverture de socket ne dit pas POURQUOI — port filtré par
 * l'hébergeur, absence de route IPv6, ou résolution DNS défaillante donnent la
 * même erreur. On ne peut pas choisir un correctif sans distinguer ces cas.</p>
 *
 * <p>La sonde teste donc successivement les deux ports SMTP de Gmail et journalise
 * les adresses résolues, ce qui tranche entre les hypothèses :</p>
 * <ul>
 *   <li>les deux ports échouent, adresses IPv4 présentes → filtrage de l'hébergeur ;</li>
 *   <li>seules des adresses IPv6 sont résolues → absence de route IPv6 ;</li>
 *   <li>465 passe et 587 non → filtrage ciblé, il suffit de changer MAIL_PORT.</li>
 * </ul>
 *
 * <p>Coût : quelques secondes au démarrage, bornées. Désactivable par
 * {@code genuc.mail.sonde.enabled=false}.</p>
 */
@Slf4j
@Component
public class SondeConnectiviteSmtp {

    private static final int DELAI_MS = 5000;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String hote;

    @Value("${genuc.mail.sonde.enabled:true}")
    private boolean active;

    @EventListener(ApplicationReadyEvent.class)
    public void sonder() {
        if (!active) {
            return;
        }
        log.info("── Sonde SMTP : diagnostic de connectivité sortante vers {} ──", hote);

        try {
            InetAddress[] adresses = InetAddress.getAllByName(hote);
            StringBuilder resume = new StringBuilder();
            int v4 = 0;
            int v6 = 0;
            for (InetAddress a : adresses) {
                boolean estV4 = a.getAddress().length == 4;
                if (estV4) {
                    v4++;
                } else {
                    v6++;
                }
                resume.append(a.getHostAddress()).append(' ');
            }
            log.info("Sonde SMTP : {} résolu en {} adresse(s) — {} IPv4, {} IPv6 [{}]",
                hote, adresses.length, v4, v6, resume.toString().trim());
        } catch (UnknownHostException e) {
            log.warn("Sonde SMTP : résolution DNS de {} IMPOSSIBLE : {}", hote, e.getMessage());
            return;
        }

        for (int port : new int[] { 587, 465, 25, 2525 }) {
            tester(port);
        }
        log.info("── Fin de la sonde SMTP ──");
    }

    private void tester(int port) {
        long debut = System.currentTimeMillis();
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(hote, port), DELAI_MS);
            log.info("Sonde SMTP : {}:{} JOIGNABLE en {} ms", hote, port, System.currentTimeMillis() - debut);
        } catch (IOException e) {
            log.warn("Sonde SMTP : {}:{} INJOIGNABLE après {} ms — {}: {}",
                hote, port, System.currentTimeMillis() - debut,
                e.getClass().getSimpleName(), e.getMessage());
        }
    }
}
