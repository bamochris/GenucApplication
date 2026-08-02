package cd.genuc.service;

import cd.genuc.exception.UtilisateurNotFoundException;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.UtilisateurRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @PersistenceContext
    private EntityManager em;

    // Normalise les noms : trim, espaces multiples et caractères de contrôle uniquement.
    // Les accents (é, è, ç, â) et caractères africains sont préservés.
    private String nettoyer(String input) {
        if (input == null) return null;
        // Supprimer les caractères de contrôle ASCII mais garder tout l'Unicode lettres/chiffres
        return input.trim().replaceAll("\\s+", " ").replaceAll("[\\p{Cntrl}]", "");
    }

    // ══════════════════════════════════════════
    // MÉTHODES EXISTANTES
    // ══════════════════════════════════════════

    public List<Utilisateur> findAll() {
        return utilisateurRepository.findAll();
    }

    public Utilisateur findById(Long id) {
        return utilisateurRepository.findById(id)
            .orElseThrow(() -> new UtilisateurNotFoundException(id));
    }

    @Transactional
    public Utilisateur save(Utilisateur utilisateur) {
        if (utilisateur.getNom() != null) {
            utilisateur.setNom(nettoyer(utilisateur.getNom()));
        }
        if (utilisateur.getPrenom() != null) {
            utilisateur.setPrenom(nettoyer(utilisateur.getPrenom()));
        }
        return utilisateurRepository.save(utilisateur);
    }

    @Transactional
    public Utilisateur update(Long id, Utilisateur details) {
        Utilisateur user = findById(id);
        
        if (details.getNom() != null) user.setNom(nettoyer(details.getNom()));
        if (details.getPrenom() != null) user.setPrenom(nettoyer(details.getPrenom()));
        if (details.getEmail() != null) user.setEmail(details.getEmail());
        if (details.getTelephone() != null) user.setTelephone(details.getTelephone());
        if (details.getRole() != null) user.setRole(details.getRole());
        user.setActif(details.isActif());
        
        if (details.getUniversiteId() != null) user.setUniversiteId(details.getUniversiteId());
        if (details.getDepartementId() != null) user.setDepartementId(details.getDepartementId());
        
        return utilisateurRepository.save(user);
    }

    @Transactional
    public void delete(Long id) {
        Utilisateur user = findById(id);
        user.setActif(false); // Soft delete
        utilisateurRepository.save(user);
    }

    /**
     * Suppression DÉFINITIVE d'un utilisateur ET de toute son empreinte : plus aucune
     * trace du mail/nom, l'email redevient réutilisable. On purge :
     *  - tout dossier d'inscription / étudiant / inscription portant le MÊME email
     *    (le formulaire d'inscription public crée ces enregistrements sans les relier
     *    au compte) et leurs dépendances (paiements, notes, échéanciers, frais…) ;
     *  - les données de session/personnelles du compte (tokens, rôles, événements…) ;
     *  - le compte lui-même.
     * Ordre : enfants « NO ACTION » d'abord (sinon ils bloquent), le reste part en
     * CASCADE via la suppression des étudiants. Le tout est transactionnel : en cas de
     * dépendance résiduelle inattendue, tout est annulé (aucune suppression partielle)
     * et le contrôleur renvoie un 409 clair.
     */
    @Transactional
    public void supprimerDefinitivement(Long id) {
        Utilisateur user = findById(id);
        final Long uid = user.getId();
        final String email = user.getEmail();

        // ── Empreinte "candidat / étudiant" liée à l'email ─────────────────────
        if (email != null && !email.isBlank()) {
            final String etuSub  = "(SELECT id FROM etudiants WHERE lower(email) = lower(:email))";
            final String insSub  = "(SELECT id FROM inscriptions WHERE etudiant_id IN " + etuSub + ")";
            final String paieSub = "(SELECT id FROM paiements WHERE inscription_id IN " + insSub + ")";

            String[] parEmail = {
                // enfants des paiements (NO ACTION) — avant la cascade des paiements
                "DELETE FROM operations_caisse     WHERE paiement_id IN " + paieSub,
                "DELETE FROM transactions_externes WHERE paiement_id IN " + paieSub,
                "DELETE FROM affectations_frais    WHERE inscription_id IN " + insSub,
                "DELETE FROM remboursements         WHERE etudiant_id IN " + etuSub,
                // enfants des inscriptions (NO ACTION)
                "DELETE FROM association_membres    WHERE inscription_id IN " + insSub,
                "DELETE FROM bons_paiement          WHERE inscription_id IN " + insSub,
                "DELETE FROM candidatures_stage     WHERE inscription_id IN " + insSub,
                "DELETE FROM deliberations          WHERE inscription_id IN " + insSub,
                "DELETE FROM evenement_participants WHERE inscription_id IN " + insSub,
                "DELETE FROM recours                WHERE inscription_id IN " + insSub,
                "DELETE FROM soumissions_travaux    WHERE inscription_id IN " + insSub,
                "DELETE FROM stages                 WHERE inscription_id IN " + insSub,
                "DELETE FROM tfc                    WHERE inscription_id IN " + insSub,
                // enfants des étudiants (NO ACTION)
                "DELETE FROM inscriptions_vacations WHERE etudiant_id IN " + etuSub,
                "DELETE FROM candidatures_bourse    WHERE etudiant_id IN " + etuSub,
                "DELETE FROM equivalences_diplomes  WHERE etudiant_id IN " + etuSub,
                "DELETE FROM lettres_acceptation    WHERE etudiant_id IN " + etuSub,
                "DELETE FROM transactions           WHERE student_id  IN " + etuSub,
                // étudiants → CASCADE (inscriptions, notes, paiements, présences, documents…)
                "DELETE FROM etudiants              WHERE lower(email) = lower(:email)",
                // dossiers d'inscription publics
                "DELETE FROM dossiers_inscription   WHERE lower(email) = lower(:email)",
            };
            for (String q : parEmail) {
                em.createNativeQuery(q).setParameter("email", email).executeUpdate();
            }
        }

        // ── Données de session / personnelles du compte (enfants NO ACTION) ────
        String[] parCompte = {
            "DELETE FROM refresh_tokens          WHERE utilisateur_id = :uid",
            "DELETE FROM device_tokens           WHERE utilisateur_id = :uid",
            "DELETE FROM parametres_notification WHERE utilisateur_id = :uid",
            "DELETE FROM security_events         WHERE user_id = :uid",
            "DELETE FROM user_roles              WHERE user_id = :uid",
            "DELETE FROM hierarchical_access     WHERE user_id = :uid",
        };
        for (String q : parCompte) {
            em.createNativeQuery(q).setParameter("uid", uid).executeUpdate();
        }

        // ── Le compte lui-même (notifications CASCADE, connexion_logs SET NULL) ─
        utilisateurRepository.delete(user);
        utilisateurRepository.flush();
    }

    // ══════════════════════════════════════════
    // NOUVELLES MÉTHODES
    // ══════════════════════════════════════════

    /**
     * Liste les utilisateurs d'une université
     */
    public List<Utilisateur> findByUniversiteId(Long universiteId) {
        if (universiteId == null) return List.of();
        return utilisateurRepository.findByUniversiteId(universiteId);
    }

    /**
     * Recherche les utilisateurs par nom (partial)
     */
    public List<Utilisateur> rechercherParNom(String nom) {
        if (nom == null || nom.trim().isEmpty()) {
            return findAll();
        }
        return utilisateurRepository.rechercherParNom(nom);
    }

    /**
     * Liste les utilisateurs par rôle
     */
    public List<Utilisateur> findByRole(RoleEnum role) {
        if (role == null) return List.of();
        return utilisateurRepository.findByRole(role);
    }

    /**
     * Liste les utilisateurs actifs
     */
    public List<Utilisateur> findActifs() {
        return utilisateurRepository.findByActifTrue();
    }

    /**
     * Liste les utilisateurs inactifs
     */
    public List<Utilisateur> findInactifs() {
        return utilisateurRepository.findByActifFalse();
    }

    /**
     * Compte les utilisateurs actifs par université
     */
    public long countActifsByUniversite(Long universiteId) {
        if (universiteId == null) return 0;
        return utilisateurRepository.countActifsByUniversite(universiteId);
    }

    /**
     * Liste les utilisateurs par rôle et université
     */
    public List<Utilisateur> findByRoleAndUniversite(RoleEnum role, Long universiteId) {
        if (role == null || universiteId == null) return List.of();
        return utilisateurRepository.findByRoleAndUniversiteId(role, universiteId);
    }

    /**
     * Vérifie si un email existe déjà
     */
    public boolean emailExiste(String email) {
        if (email == null || email.isEmpty()) return false;
        return utilisateurRepository.existsByEmail(email);
    }

    /**
     * Trouve un utilisateur par email
     */
    public Utilisateur findByEmail(String email) {
        return utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new UtilisateurNotFoundException(email));
    }

    /**
     * Active ou désactive un utilisateur
     */
    @Transactional
    public Utilisateur setActif(Long id, boolean actif) {
        Utilisateur user = findById(id);
        user.setActif(actif);
        return utilisateurRepository.save(user);
    }

    /**
     * Change le rôle d'un utilisateur
     */
    @Transactional
    public Utilisateur changerRole(Long id, RoleEnum nouveauRole) {
        Utilisateur user = findById(id);
        user.setRole(nouveauRole);
        return utilisateurRepository.save(user);
    }

    /**
     * Compte le nombre total d'utilisateurs
     */
    public long countTotal() {
        return utilisateurRepository.count();
    }

    /**
     * Compte le nombre d'utilisateurs par rôle
     */
    public long countByRole(RoleEnum role) {
        if (role == null) return 0;
        return utilisateurRepository.countByRole(role);
    }

    /**
     * Crée un utilisateur via le panneau d'administration.
     * Hache le mot de passe, active le compte immédiatement, envoie un email de bienvenue.
     */
    @Transactional
    public Utilisateur creerUtilisateurAdmin(String nom, String prenom, String email, String telephone,
                                              String motDePasseClair, RoleEnum role,
                                              Long universiteId, Long departementId) {
        Utilisateur u = Utilisateur.builder()
            .nom(nettoyer(nom))
            .prenom(nettoyer(prenom))
            .email(email.toLowerCase().trim())
            .telephone(telephone != null ? telephone.trim() : null)
            .motDePasse(passwordEncoder.encode(motDePasseClair))
            .role(role)
            .universiteId(universiteId)
            .departementId(departementId)
            .actif(true)
            .compteActive(true)
            .build();

        Utilisateur saved = utilisateurRepository.save(u);
        emailService.envoyerEmailBienvenueStaff(saved, motDePasseClair);
        return saved;
    }
}