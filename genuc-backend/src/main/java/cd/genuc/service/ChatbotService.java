package cd.genuc.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final CacheService cacheService;

    private static final Map<String, String> BASE_REPONSES = Map.ofEntries(
        Map.entry("notes", "Vos notes sont accessibles dans votre tableau de bord > Mes résultats."),
        Map.entry("frais", "Consultez et payez vos frais dans « Mes paiements » de votre portail étudiant (frais à payer, historique, reçus, état financier)."),
        Map.entry("horaire", "Votre emploi du temps est disponible dans « Mon horaire »."),
        Map.entry("inscription", "Pour vous inscrire : page « S'inscrire à une université » (/inscriptions-universites), choisissez votre filière puis remplissez le formulaire en ligne."),
        Map.entry("support", "Contactez le support GENUC : support@genuc.cd ou au +243 XXX XXX XXX"),
        Map.entry("diplome", "Vérifiez l'authenticité d'un diplôme sur la page /verifier."),
        Map.entry("attestation", "Demandez une attestation depuis votre portail étudiant (« Demander attestation ») ou vérifiez-en une sur /verifier-attestation."),
        Map.entry("bibliotheque", "La bibliothèque numérique est accessible depuis votre tableau de bord, ou publiquement sur /bibliotheque-publique."),
        Map.entry("stage", "Les offres de stage sont dans la section Emploi & Stages."),
        Map.entry("emploi", "Les offres d'emploi étudiant sur campus sont sur la page Emploi étudiant (/emploi-universitaire)."),
        Map.entry("bourse", "Consultez les bourses disponibles dans Finances > Bourses."),
        Map.entry("paiement", "Effectuez vos paiements via TachPay (Mobile Money M-Pesa, Orange Money, Airtel Money ou carte bancaire) depuis « Mes paiements », ou en caisse."),
        Map.entry("orientation", "Pas sûr de votre filière ? Faites le test d'orientation sur la page /orientation."),
        Map.entry("carte", "Votre carte d'étudiant numérique est disponible dans votre portail (« Carte étudiant »)."),
        Map.entry("recours", "Déposez un recours académique depuis votre portail étudiant (« Recours académiques »)."),
        Map.entry("dossier", "Suivez l'avancement de votre dossier d'inscription sur la page /suivi-dossier avec votre numéro de dossier."),
        Map.entry("mot de passe", "Mot de passe oublié ? Utilisez le lien « Mot de passe oublié » sur la page de connexion, ou contactez support@genuc.cd.")
    );

    public String traiterQuestion(String question, String role, Long userId, List<Map<String, String>> historique) {
        if (question == null || question.isBlank()) {
            return "Je n'ai pas compris votre question. Pouvez-vous reformuler ?";
        }

        String q = question.toLowerCase();

        /* Recherche mot-clé simple */
        for (Map.Entry<String, String> entry : BASE_REPONSES.entrySet()) {
            if (q.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        /* Réponses spécifiques au rôle */
        if ("PROFESSEUR".equals(role)) {
            if (q.contains("saisie") || q.contains("note")) return "Saisissez les notes dans Évaluation > Saisie des notes.";
            if (q.contains("présence") || q.contains("presence")) return "Gérez les présences dans Présences > Saisir les présences.";
            if (q.contains("cours")) return "Vos cours sont accessibles dans Mes cours.";
        }

        if ("ETUDIANT".equals(role)) {
            if (q.contains("résultat") || q.contains("resultat")) return "Vos résultats sont dans Mes résultats > Relevé de notes.";
            if (q.contains("bulletin")) return "Votre bulletin est disponible dans Bulletins.";
            if (q.contains("tfc") || q.contains("mémoire")) return "Suivez votre TFC/Mémoire dans la section TFC & Mémoire.";
        }

        /* Réponse par défaut */
        return "Je suis GENUC Cleverly et je n'ai pas trouvé de réponse précise à votre question. " +
               "Tapez « guide » pour voir toutes les pages de la plateforme, ou contactez le support " +
               "GENUC à support@genuc.cd pour une assistance personnalisée.";
    }
}
