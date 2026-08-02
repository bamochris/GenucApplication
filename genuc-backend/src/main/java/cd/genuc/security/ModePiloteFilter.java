package cd.genuc.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Refuse les encaissements par prestataire externe tant que la plateforme tourne
 * en mode pilote ({@code genuc.payment.mode-pilote=true}).
 *
 * <p>Contexte : {@code TachPayProductionReadinessCheck} interdit de démarrer en
 * production sans les identifiants des quatre opérateurs mobile money et de
 * Stripe. C'est un garde-fou justifié — {@code MobileMoneyService} simule encore
 * les appels opérateurs — mais il empêche d'exploiter la partie académique tant
 * que les contrats ne sont pas signés.</p>
 *
 * <p>Le mode pilote lève cette exigence <b>en fermant réellement la porte</b>
 * plutôt qu'en la laissant entrouverte : les endpoints d'encaissement externe
 * répondent 503, sans jamais atteindre le service. Sans ce filtre, désactiver le
 * contrôle laisserait passer des paiements traités par un simulateur — c'est-à-dire
 * des encaissements fictifs enregistrés comme réels.</p>
 *
 * <p>Ce qui reste ouvert : {@code /api/paiements} (saisie en caisse : espèces,
 * virement, dépôt bancaire). Un établissement doit pouvoir encaisser au guichet
 * pendant le pilote ; ces flux ne dépendent d'aucun prestataire externe.</p>
 */
@Slf4j
@Component
// Avant la chaîne Spring Security (FilterChainProxy est à -100) : le paiement
// des frais de dossier est un endpoint public, il doit être fermé lui aussi.
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ModePiloteFilter extends OncePerRequestFilter {

    /**
     * Préfixes fermés. Tout ce qui délègue l'encaissement à un tiers :
     * initiation mobile money, API de paiement v1, portail TachPay, et les
     * callbacks opérateurs (aucun ne peut légitimement arriver sans contrat —
     * un appel sur ces routes en mode pilote est au mieux une erreur de
     * configuration, au pire une tentative de forger une confirmation).
     */
    private static final List<String> PREFIXES_FERMES = List.of(
            "/api/payments/mobile",
            "/api/payments/callback",
            "/api/v1/payments",
            "/api/tachpay",
            "/api/tachfee");

    private final boolean modePilote;

    public ModePiloteFilter(@Value("${genuc.payment.mode-pilote:false}") boolean modePilote) {
        this.modePilote = modePilote;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest requete) {
        // Les préflights CORS doivent recevoir leurs en-têtes, pas un 503 : sinon
        // le navigateur signale une erreur CORS opaque au lieu du refus explicite
        // que le front sait afficher.
        return !modePilote || HttpMethod.OPTIONS.matches(requete.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest requete,
                                    HttpServletResponse reponse,
                                    FilterChain chaine) throws ServletException, IOException {
        String chemin = requete.getRequestURI();

        if (estFerme(chemin)) {
            log.warn("Mode pilote : encaissement externe refuse sur {} {}",
                    requete.getMethod(), chemin);
            reponse.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
            reponse.setContentType(MediaType.APPLICATION_JSON_VALUE);
            reponse.setCharacterEncoding("UTF-8");
            reponse.getWriter().write("""
                {"success":false,"code":"PAIEMENT_INDISPONIBLE",\
                "message":"Le paiement en ligne n'est pas encore disponible. \
                Veuillez vous adresser à la caisse de votre établissement.",\
                "status":503}""");
            return;
        }

        chaine.doFilter(requete, reponse);
    }

    private boolean estFerme(String chemin) {
        // Le paiement des frais de dossier passe par /api/dossiers/{numero}/payer,
        // qui délègue lui aussi à un opérateur : il doit être fermé, alors que le
        // reste de /api/dossiers (dépôt, suivi, statut) doit rester accessible.
        if (chemin.startsWith("/api/dossiers/") && chemin.endsWith("/payer")) {
            return true;
        }
        return PREFIXES_FERMES.stream().anyMatch(chemin::startsWith);
    }
}
