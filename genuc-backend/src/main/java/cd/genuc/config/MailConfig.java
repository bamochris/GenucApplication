package cd.genuc.config;

import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Transport SMTP.
 *
 * <p>Cette classe construit le {@link JavaMailSenderImpl} à la main. Conséquence
 * longtemps passée inaperçue : les {@code spring.mail.properties.*} déclarées
 * dans {@code application.yml} n'étaient PAS reprises, puisque Spring Boot ne
 * les applique que lorsqu'il crée le sender lui-même. Les délais d'attente
 * (connectiontimeout/timeout/writetimeout) restaient donc infinis — ce que
 * confirmait la trace de production « timeout -1 » : un échec de connexion
 * pendait sans borne au lieu d'échouer vite et proprement.</p>
 *
 * <p>La configuration est désormais lue via {@link MailProperties}, qui lie tout
 * le bloc {@code spring.mail.*}, et le chiffrement s'adapte au port :</p>
 * <ul>
 *   <li><b>587</b> — STARTTLS (connexion en clair puis élévation TLS) ;</li>
 *   <li><b>465</b> — SSL/TLS implicite, requis par Gmail sur ce port. L'ancienne
 *       configuration imposait STARTTLS quel que soit le port : basculer sur 465
 *       pour contourner un filtrage réseau était donc impossible.</li>
 * </ul>
 */
@Configuration
public class MailConfig {

    /** Port SSL implicite de Gmail. Sur ce port, STARTTLS n'a pas de sens. */
    private static final int PORT_SSL_IMPLICITE = 465;

    @Bean
    public JavaMailSender javaMailSender(MailProperties mailProperties) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(mailProperties.getHost() != null ? mailProperties.getHost() : "smtp.gmail.com");
        int port = mailProperties.getPort() != null ? mailProperties.getPort() : 587;
        mailSender.setPort(port);
        mailSender.setUsername(mailProperties.getUsername());
        mailSender.setPassword(mailProperties.getPassword());
        if (mailProperties.getDefaultEncoding() != null) {
            mailSender.setDefaultEncoding(mailProperties.getDefaultEncoding().name());
        }

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");

        if (port == PORT_SSL_IMPLICITE) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.starttls.enable", "false");
            props.put("mail.smtp.starttls.required", "false");
        } else {
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
        }

        // Bornes par défaut : sans elles, une connexion filtrée par un pare-feu
        // reste pendue et immobilise le fil d'envoi des notifications.
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        props.put("mail.debug", "false");

        // Le fichier de configuration a le dernier mot : les valeurs ci-dessus ne
        // sont que des défauts raisonnables. Les clés y sont déjà complètes
        // (« mail.smtp.… »), on les recopie sans les préfixer.
        mailProperties.getProperties().forEach(props::put);

        return mailSender;
    }
}
