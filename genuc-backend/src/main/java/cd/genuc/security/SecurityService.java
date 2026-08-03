package cd.genuc.security;

import cd.genuc.model.DossierInscription;
import cd.genuc.model.Etudiant;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Transaction;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.DossierInscriptionRepository;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.repository.InscriptionRepository.ProprietaireInscription;
import cd.genuc.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

/**
 * Garde d'accès central aux données rattachées à une inscription.
 *
 * <p>Historiquement, les endpoints du portail étudiant se contentaient d'un
 * {@code @PreAuthorize("hasAnyRole('ETUDIANT', ...)")} et prenaient l'{@code inscriptionId}
 * tel quel dans l'URL. Le rôle était vérifié, jamais la propriété : n'importe quel
 * étudiant connecté pouvait lire — et via {@code PUT /api/etudiant/portal/profil/{id}}
 * MODIFIER — le dossier d'un autre étudiant en changeant l'identifiant (IDOR).</p>
 *
 * <p>Ce service est exposé au SpEL de Spring Security sous le nom {@code securityService} :</p>
 * <pre>{@code
 * @PreAuthorize("@securityService.peutAccederInscription(#inscriptionId, authentication)")
 * }</pre>
 *
 * <p>Règles appliquées :</p>
 * <ul>
 *   <li><b>SUPER_ADMIN / ADMIN_SYSTEME</b> — accès global (supervision nationale).</li>
 *   <li><b>ETUDIANT / STUDENT</b> — uniquement sa propre inscription. La référence est le
 *       claim {@code inscriptionId} du JWT (recopié sur {@link Utilisateur}) ; pour les
 *       comptes anciens où ce champ est nul, on retombe sur une comparaison d'email.</li>
 *   <li><b>Tous les autres rôles (personnel)</b> — uniquement les inscriptions de leur
 *       propre université. C'est la même règle multi-tenant que les listes admin, mais
 *       elle n'était appliquée nulle part sur ces endpoints.</li>
 * </ul>
 *
 * <p>Un refus est journalisé en WARN : une rafale de refus sur un même compte est le
 * signal d'une énumération d'identifiants.</p>
 */
@Slf4j
@Service("securityService")
@RequiredArgsConstructor
public class SecurityService {

    private final InscriptionRepository inscriptionRepository;
    private final TransactionRepository transactionRepository;
    private final DossierInscriptionRepository dossierInscriptionRepository;

    /** Rôles autorisés à consulter n'importe quelle inscription, toutes universités confondues. */
    private static final Set<RoleEnum> ROLES_GLOBAUX = EnumSet.of(
            RoleEnum.SUPER_ADMIN,
            RoleEnum.ADMIN_SYSTEME);

    /** Rôles limités à LEUR PROPRE inscription (jamais celle d'un tiers). */
    private static final Set<RoleEnum> ROLES_ETUDIANT = EnumSet.of(
            RoleEnum.ETUDIANT,
            RoleEnum.STUDENT);

    /**
     * @param inscriptionId identifiant demandé dans l'URL ou le corps de la requête
     * @param authentication contexte de sécurité courant (injecté par le SpEL)
     * @return {@code true} si l'appelant a le droit de manipuler cette inscription
     */
    public boolean peutAccederInscription(Long inscriptionId, Authentication authentication) {
        if (inscriptionId == null) {
            return false;
        }
        Utilisateur utilisateur = extraireUtilisateur(authentication);
        if (utilisateur == null) {
            return false;
        }

        RoleEnum role = utilisateur.getRole();
        if (role != null && ROLES_GLOBAUX.contains(role)) {
            return true;
        }

        if (role != null && ROLES_ETUDIANT.contains(role)) {
            return estSonInscription(utilisateur, inscriptionId);
        }

        // Personnel : cloisonnement par établissement puis par département si défini.
        if (!estDansSonUniversite(utilisateur, inscriptionId)) {
            return false;
        }

        Long departementAppelant = utilisateur.getDepartementId();
        if (departementAppelant == null) {
            return true;
        }

        ProprietaireInscription cible = inscriptionRepository.findProprietaire(inscriptionId).orElse(null);
        if (cible == null || cible.getDepartementId() == null) {
            return true;
        }

        boolean autorise = departementAppelant.equals(cible.getDepartementId());
        if (!autorise) {
            journaliserRefus(utilisateur, inscriptionId, "inscription d'un autre département");
        }
        return autorise;
    }

    /** Variante sans {@code Authentication} explicite, pour un appel depuis une couche service. */
    public boolean peutAccederInscription(Long inscriptionId) {
        return peutAccederInscription(inscriptionId, SecurityContextHolder.getContext().getAuthentication());
    }

    /**
     * Résout l'inscription de l'étudiant connecté. À utiliser quand un endpoint n'a
     * pas besoin de recevoir l'identifiant depuis le client — c'est la protection la
     * plus robuste contre l'IDOR : la donnée ne vient jamais de la requête.
     *
     * @return l'{@code inscriptionId} du compte connecté, ou {@code null} si l'appelant
     *         n'est pas un étudiant ou n'a pas d'inscription rattachée.
     */
    public Long inscriptionCourante() {
        Utilisateur utilisateur = extraireUtilisateur(SecurityContextHolder.getContext().getAuthentication());
        return utilisateur == null ? null : utilisateur.getInscriptionId();
    }

    /**
     * Vérifie qu'une ressource appartient bien à l'université de l'appelant.
     * Utilisable directement en SpEL pour les endpoints portant un {@code universiteId}.
     */
    public boolean peutAccederUniversite(Long universiteId, Authentication authentication) {
        if (universiteId == null) {
            return false;
        }
        Utilisateur utilisateur = extraireUtilisateur(authentication);
        if (utilisateur == null) {
            return false;
        }
        if (utilisateur.getRole() != null && ROLES_GLOBAUX.contains(utilisateur.getRole())) {
            return true;
        }
        return universiteId.equals(utilisateur.getUniversiteId());
    }

    /**
     * Vérifie que l'appelant a le droit de manipuler une transaction de paiement.
     *
     * <p>{@code @PreAuthorize("isAuthenticated()")} ne protégeait rien ici : n'importe
     * quel compte connecté pouvait annuler la transaction d'un tiers en énumérant les
     * identifiants. Règles :</p>
     * <ul>
     *   <li><b>SUPER_ADMIN / ADMIN_SYSTEME</b> — accès global.</li>
     *   <li><b>Initiateur</b> — le compte qui a créé la transaction ({@code createdBy}).</li>
     *   <li><b>ETUDIANT / STUDENT</b> — uniquement ses propres transactions (lien par
     *       email du dossier étudiant, seul rattachement porté par l'entité).</li>
     *   <li><b>Personnel</b> — uniquement les transactions de leur propre université.</li>
     * </ul>
     */
    public boolean peutAccederTransaction(Long transactionId, Authentication authentication) {
        if (transactionId == null) {
            return false;
        }
        Utilisateur utilisateur = extraireUtilisateur(authentication);
        if (utilisateur == null) {
            return false;
        }
        if (estRoleGlobal(utilisateur)) {
            return true;
        }
        // On ne distingue pas « inexistante » de « interdite » : répondre différemment
        // transformerait l'endpoint en oracle d'existence d'identifiants.
        return autoriserTransaction(transactionRepository.findById(transactionId).orElse(null),
                utilisateur, transactionId);
    }

    /** Même garde, pour les endpoints qui désignent la transaction par son code public. */
    public boolean peutAccederTransactionParCode(String transactionCode, Authentication authentication) {
        if (transactionCode == null || transactionCode.isBlank()) {
            return false;
        }
        Utilisateur utilisateur = extraireUtilisateur(authentication);
        if (utilisateur == null) {
            return false;
        }
        if (estRoleGlobal(utilisateur)) {
            return true;
        }
        Transaction transaction = transactionRepository.findByTransactionCode(transactionCode).orElse(null);
        return autoriserTransaction(transaction, utilisateur,
                transaction == null ? null : transaction.getId());
    }

    private boolean autoriserTransaction(Transaction transaction, Utilisateur utilisateur, Long transactionId) {
        if (transaction == null) {
            return false;
        }
        RoleEnum role = utilisateur.getRole();

        Utilisateur initiateur = transaction.getCreatedBy();
        if (initiateur != null && initiateur.getId() != null
                && initiateur.getId().equals(utilisateur.getId())) {
            return true;
        }

        if (role != null && ROLES_ETUDIANT.contains(role)) {
            Etudiant etudiant = transaction.getStudent();
            boolean autorise = etudiant != null && memeEmail(utilisateur.getEmail(), etudiant.getEmail());
            if (!autorise) {
                journaliserRefusTransaction(utilisateur, transactionId, "transaction d'un autre étudiant");
            }
            return autorise;
        }

        Long universiteAppelant = utilisateur.getUniversiteId();
        if (universiteAppelant == null || transaction.getUniversite() == null) {
            journaliserRefusTransaction(utilisateur, transactionId, "aucune université de rattachement");
            return false;
        }
        boolean autorise = universiteAppelant.equals(transaction.getUniversite().getId());
        if (!autorise) {
            journaliserRefusTransaction(utilisateur, transactionId, "transaction d'une autre université");
        }
        return autorise;
    }

    /**
     * Vérifie que l'appelant a le droit de modifier ou d'annuler un dossier d'inscription.
     *
     * <p>Un dossier est déposé sans compte préexistant : le seul rattachement est
     * l'email saisi au dépôt, qui est aussi celui du compte créé dans la foulée.
     * Sans ce contrôle, tout compte connecté pouvait faire passer n'importe quel
     * dossier en attente au statut REJETE (sabotage des admissions).</p>
     */
    public boolean peutAccederDossier(Long dossierId, Authentication authentication) {
        if (dossierId == null) {
            return false;
        }
        Utilisateur utilisateur = extraireUtilisateur(authentication);
        if (utilisateur == null) {
            return false;
        }
        if (estRoleGlobal(utilisateur)) {
            return true;
        }
        RoleEnum role = utilisateur.getRole();

        DossierInscription dossier = dossierInscriptionRepository.findById(dossierId).orElse(null);
        if (dossier == null) {
            return false;
        }

        if (memeEmail(utilisateur.getEmail(), dossier.getEmail())) {
            return true;
        }

        // Personnel : cloisonnement par établissement, comme les listes admin.
        Long universiteAppelant = utilisateur.getUniversiteId();
        boolean autorise = universiteAppelant != null
                && !ROLES_ETUDIANT.contains(role)
                && universiteAppelant.equals(dossier.getUniversiteId());
        if (!autorise) {
            log.warn("Accès refusé au dossier {} pour {} (rôle {}) : dossier d'un tiers",
                    dossierId, utilisateur.getEmail(), role);
        }
        return autorise;
    }

    // ══════════════════════════════════════════
    // Interne
    // ══════════════════════════════════════════

    private boolean estRoleGlobal(Utilisateur utilisateur) {
        RoleEnum role = utilisateur.getRole();
        return role != null && ROLES_GLOBAUX.contains(role);
    }

    private Utilisateur extraireUtilisateur(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        // CustomUserDetailsService renvoie l'entité Utilisateur elle-même. Un principal
        // "anonymousUser" (String) ou tout autre type ne donne aucun droit.
        return principal instanceof Utilisateur u ? u : null;
    }

    private boolean estSonInscription(Utilisateur utilisateur, Long inscriptionId) {
        Long sienne = utilisateur.getInscriptionId();
        if (sienne != null) {
            boolean autorise = sienne.equals(inscriptionId);
            if (!autorise) {
                journaliserRefus(utilisateur, inscriptionId, "inscription d'un autre étudiant");
            }
            return autorise;
        }

        // Comptes créés avant que le lien Utilisateur → Inscription soit systématique :
        // repli sur l'email. On ne refuse pas d'emblée pour ne pas casser ces comptes,
        // mais la correspondance doit être exacte.
        ProprietaireInscription cible = inscriptionRepository.findProprietaire(inscriptionId).orElse(null);
        if (cible == null) {
            return false;
        }
        boolean autorise = memeEmail(utilisateur.getEmail(), cible.getEmailInscription())
                || memeEmail(utilisateur.getEmail(), cible.getEmailEtudiant());
        if (!autorise) {
            journaliserRefus(utilisateur, inscriptionId, "aucun lien compte ↔ inscription");
        }
        return autorise;
    }

    private boolean estDansSonUniversite(Utilisateur utilisateur, Long inscriptionId) {
        Long universiteAppelant = utilisateur.getUniversiteId();
        if (universiteAppelant == null) {
            journaliserRefus(utilisateur, inscriptionId, "compte sans université de rattachement");
            return false;
        }
        ProprietaireInscription cible = inscriptionRepository.findProprietaire(inscriptionId).orElse(null);
        if (cible == null) {
            return false;
        }
        boolean autorise = universiteAppelant.equals(cible.getUniversiteId());
        if (!autorise) {
            journaliserRefus(utilisateur, inscriptionId, "inscription d'une autre université");
        }
        return autorise;
    }

    private boolean memeEmail(String a, String b) {
        return a != null && b != null && !a.isBlank()
                && a.trim().toLowerCase(Locale.ROOT).equals(b.trim().toLowerCase(Locale.ROOT));
    }

    private void journaliserRefus(Utilisateur utilisateur, Long inscriptionId, String motif) {
        log.warn("Accès refusé à l'inscription {} pour {} (rôle {}) : {}",
                inscriptionId, utilisateur.getEmail(), utilisateur.getRole(), motif);
    }

    private void journaliserRefusTransaction(Utilisateur utilisateur, Long transactionId, String motif) {
        log.warn("Accès refusé à la transaction {} pour {} (rôle {}) : {}",
                transactionId, utilisateur.getEmail(), utilisateur.getRole(), motif);
    }
}
