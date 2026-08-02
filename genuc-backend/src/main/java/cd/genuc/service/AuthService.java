package cd.genuc.service;

import cd.genuc.exception.BusinessException;
import cd.genuc.exception.EmailAlreadyExistsException;
import cd.genuc.exception.InvalidCredentialsException;
import cd.genuc.model.RefreshToken;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.UtilisateurRepository;
import cd.genuc.security.JwtService;
import cd.genuc.security.LoginAttemptService;
import cd.genuc.security.RefreshTokenService;
import cd.genuc.util.PasswordValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final LoginAttemptService loginAttemptService;
    private final RefreshTokenService refreshTokenService;
    private final TwoFactorService twoFactorService;
    private final cd.genuc.repository.InscriptionRepository inscriptionRepository;
    private final cd.genuc.repository.EtudiantRepository etudiantRepository;
    private final EmailService emailService;
    private final StockageFichierService stockage;

    @Transactional
    public Map<String, Object> inscrire(
            String nom, String prenom, String email, String motDePasse,
            String telephone, RoleEnum role, Long universiteId, Long departementId) {
        if (utilisateurRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        PasswordValidator.ValidationResult validation = PasswordValidator.validate(motDePasse);
        if (!validation.estValide()) {
            throw new BusinessException(
                    "VALIDATION_PASSWORD",
                    String.join("; ", validation.getErreurs()));
        }

        validerRegleRole(role, universiteId, departementId);

        Utilisateur utilisateur = Utilisateur.builder()
            .nom(nom.toUpperCase())
            .prenom(prenom)
            .email(email.toLowerCase())
            .motDePasse(passwordEncoder.encode(motDePasse))
            .telephone(telephone)
            .role(role)
            .universiteId(universiteId)
            .departementId(departementId)
            .compteActive(true)
            .actif(true)
            .build();

        utilisateurRepository.save(utilisateur);

        String accessToken = jwtService.genererToken(utilisateur);
        return construireReponse(accessToken, null, utilisateur);
    }

    @Transactional
    public Map<String, Object> connecter(String email, String motDePasse) {
        // L'identifiant peut etre un email OU un matricule etudiant : sans
        // « @ », on resout le matricule vers l'email du compte via
        // l'inscription (ou le referentiel etudiant).
        String emailNorm = resoudreIdentifiant(email).toLowerCase();

        if (loginAttemptService.estVerrouille(emailNorm)) {
            throw new InvalidCredentialsException(emailNorm,
                "Compte temporairement verrouillé suite à de trop nombreuses tentatives. Réessayez dans 15 minutes.");
        }

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(emailNorm, motDePasse)
            );
        } catch (Exception e) {
            // Toujours logué en DEBUG (jamais au-dessus — cette branche couvre aussi les simples
            // mots de passe erronés, très fréquents). Sans ce log, une erreur inattendue (ex:
            // mapping Hibernate, config) est indiscernable d'un mot de passe incorrect et n'était
            // visible nulle part avant ce correctif.
            log.debug("Échec authenticate() pour {} : {}", emailNorm, e.toString());
            loginAttemptService.loginEchoue(emailNorm);
            throw new InvalidCredentialsException(emailNorm);
        }

        Utilisateur utilisateur = utilisateurRepository.findByEmail(emailNorm)
            .orElseThrow(() -> new InvalidCredentialsException(emailNorm));

        if (!utilisateur.isCompteActive()) {
            throw new BusinessException("COMPTE_NON_ACTIVE", "Compte non activé. Veuillez vérifier vos emails.");
        }

        loginAttemptService.loginReussi(emailNorm);
        utilisateur.setDernierLogin(LocalDateTime.now());
        utilisateurRepository.save(utilisateur);

        if (utilisateur.isTwoFactorEnabled()) {
            Map<String, Object> reponse = new HashMap<>();
            reponse.put("mfaRequired", true);
            reponse.put("mfaChallengeToken", jwtService.genererTokenDefiMfa(utilisateur));
            return reponse;
        }

        String accessToken = jwtService.genererToken(utilisateur);
        // La valeur en clair n'existe que dans cette réponse : la base ne stocke que son haché.
        var refreshToken = refreshTokenService.emettre(utilisateur);
        return construireReponse(accessToken, refreshToken.valeur(), utilisateur);
    }

    /**
     * Deuxième étape de la connexion pour un compte avec 2FA activée : échange le
     * {@code mfaChallengeToken} (délivré par {@link #connecter}) contre un vrai jeton d'accès,
     * après vérification du code TOTP.
     */
    @Transactional
    public Map<String, Object> verifierMfaEtConnecter(String mfaChallengeToken, String code) {
        if (!jwtService.estDefiMfa(mfaChallengeToken)) {
            throw new InvalidCredentialsException(null, "Jeton de défi 2FA invalide ou expiré");
        }
        String email = jwtService.extraireEmail(mfaChallengeToken);
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException(email));

        if (!utilisateur.isTwoFactorEnabled() || !twoFactorService.verifierCode(utilisateur, code)) {
            throw new InvalidCredentialsException(email, "Code de vérification invalide");
        }

        String accessToken = jwtService.genererToken(utilisateur);
        // La valeur en clair n'existe que dans cette réponse : la base ne stocke que son haché.
        var refreshToken = refreshTokenService.emettre(utilisateur);
        return construireReponse(accessToken, refreshToken.valeur(), utilisateur);
    }

    private void validerRegleRole(RoleEnum role, Long universiteId, Long departementId) {
        switch (role) {
            case ADMIN_UNIVERSITE, RECTEUR, DOYEN, CHEF_DEPARTEMENT, COORDINATEUR, CAISSIER -> {
                if (universiteId == null) throw new BusinessException("L'universiteId est requis pour le rôle : " + role);
            }
            case ENSEIGNANT, CORRECTEUR -> {
                if (universiteId == null || departementId == null)
                    throw new BusinessException("universiteId ET departementId sont requis pour le rôle : " + role);
            }
            case SUPER_ADMIN, ADMIN_SYSTEME, AUDITEUR -> {
                // Pas de contrainte
            }
            case ETUDIANT, BIBLIOTHECAIRE, INVITE -> {
                // Géré via workflow spécifique
            }
        }
    }

    private Map<String, Object> construireReponse(String accessToken, String refreshToken, Utilisateur utilisateur) {
        Map<String, Object> reponse = new HashMap<>();
        reponse.put("token", accessToken);
        reponse.put("type", "Bearer");
        if (refreshToken != null) {
            reponse.put("refreshToken", refreshToken);
        }
        reponse.put("id", utilisateur.getId());
        reponse.put("nomComplet", utilisateur.getNomComplet());
        reponse.put("email", utilisateur.getEmail());
        reponse.put("role", utilisateur.getRole());
        reponse.put("universiteId", utilisateur.getUniversiteId());
        reponse.put("departementId", utilisateur.getDepartementId());
        reponse.put("compteActive", utilisateur.isCompteActive());
        reponse.put("inscriptionId", utilisateur.getInscriptionId());
        reponse.put("photoProfil", utilisateur.getPhotoProfil());
        return reponse;
    }

    // ─── Connexion par matricule + reinitialisation de mot de passe ─────

    /** Email tel quel, ou matricule resolu vers l'email du compte etudiant. */
    private String resoudreIdentifiant(String identifiant) {
        if (identifiant == null || identifiant.contains("@")) return identifiant;
        String matricule = identifiant.trim().toUpperCase();
        String email = inscriptionRepository.findByMatricule(matricule)
            .map(cd.genuc.model.Inscription::getEmail)
            .filter(e -> e != null && !e.isBlank())
            .or(() -> etudiantRepository.findByMatriculePermanent(matricule)
                .map(cd.genuc.model.Etudiant::getEmail)
                .filter(e -> e != null && !e.isBlank()))
            .orElse(null);
        // Identifiant inconnu : on laisse la suite echouer en « identifiants
        // invalides » generique (pas d'indice sur l'existence du matricule).
        return email != null ? email : identifiant;
    }

    /**
     * Mot de passe oublie par matricule : l'etudiant fournit son matricule et
     * une adresse email de contact. Regles de securite :
     * - si le compte possede deja un email, le nouveau mot de passe part
     *   UNIQUEMENT vers cet email (l'adresse fournie est ignoree) — impossible
     *   de detourner un compte existant ;
     * - la reponse est toujours identique, qu'on ait trouve un compte ou non.
     */
    @Transactional
    public void motDePasseOublieParMatricule(String matricule, String emailFourni) {
        if (matricule == null || matricule.isBlank()) return;
        String mat = matricule.trim().toUpperCase();

        String emailCompte = inscriptionRepository.findByMatricule(mat)
            .map(cd.genuc.model.Inscription::getEmail)
            .filter(e -> e != null && !e.isBlank())
            .or(() -> etudiantRepository.findByMatriculePermanent(mat)
                .map(cd.genuc.model.Etudiant::getEmail)
                .filter(e -> e != null && !e.isBlank()))
            .orElse(null);

        Utilisateur compte = null;
        if (emailCompte != null) {
            compte = utilisateurRepository.findByEmail(emailCompte.toLowerCase()).orElse(null);
        }
        if (compte == null && emailFourni != null && !emailFourni.isBlank()) {
            // Compte peut-etre cree directement avec l'email fourni
            compte = utilisateurRepository.findByEmail(emailFourni.toLowerCase().trim()).orElse(null);
        }
        if (compte == null) {
            log.info("Reinitialisation demandee pour matricule inconnu ou sans compte : {}", mat);
            return; // reponse generique cote controleur
        }

        String destination = compte.getEmail();
        boolean compteSansEmailReel = destination == null || destination.isBlank()
            || destination.endsWith("@genuc.local");
        if (compteSansEmailReel) {
            if (emailFourni == null || emailFourni.isBlank()) return;
            destination = emailFourni.toLowerCase().trim();
            // L'etudiant attache ainsi sa premiere adresse de contact
            if (utilisateurRepository.findByEmail(destination).isEmpty()) {
                compte.setEmail(destination);
            }
        }

        String temporaire = genererMotDePasseTemporaire();
        compte.setMotDePasse(passwordEncoder.encode(temporaire));
        utilisateurRepository.save(compte);

        try {
            emailService.envoyerEmail(destination,
                "GENUC — Réinitialisation de votre mot de passe",
                "Bonjour " + (compte.getPrenom() != null ? compte.getPrenom() : "") + ",\n\n"
                + "Votre mot de passe GENUC a été réinitialisé à votre demande (matricule " + mat + ").\n"
                + "Mot de passe temporaire : " + temporaire + "\n\n"
                + "Connectez-vous avec votre matricule ou votre email, puis changez ce mot de passe "
                + "depuis Paramètres > Sécurité.\n\n"
                + "Si vous n'êtes pas à l'origine de cette demande, contactez support@genuc.cd.");
            log.info("Mot de passe temporaire envoyé pour le matricule {}", mat);
        } catch (Exception e) {
            log.error("Échec d'envoi du mail de réinitialisation pour {} : {}", mat, e.getMessage());
        }
    }

    /** L'etudiant ajoute (ou remplace) son adresse email de communication. */
    @Transactional
    public void mettreAJourEmail(Utilisateur principal, String nouvelEmail) {
        if (nouvelEmail == null || !nouvelEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new RuntimeException("Adresse email invalide.");
        }
        String email = nouvelEmail.toLowerCase().trim();
        if (utilisateurRepository.findByEmail(email)
                .filter(u -> !u.getId().equals(principal.getId())).isPresent()) {
            throw new RuntimeException("Cette adresse email est deja utilisee par un autre compte.");
        }
        Utilisateur u = utilisateurRepository.findById(principal.getId())
            .orElseThrow(() -> new RuntimeException("Compte introuvable"));
        u.setEmail(email);
        utilisateurRepository.save(u);
    }

    /** Téléverse la photo de profil ou la photo passeport de l'utilisateur. */
    @Transactional
    public Map<String, String> enregistrerPhoto(Utilisateur principal, String type,
                                                org.springframework.web.multipart.MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new RuntimeException("Aucun fichier reçu.");
        }
        String contentType = fichier.getContentType() != null ? fichier.getContentType() : "";
        if (!contentType.startsWith("image/")) {
            throw new RuntimeException("Le fichier doit être une image (JPG, PNG…).");
        }
        if (fichier.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("Image trop lourde (5 Mo maximum).");
        }
        Utilisateur u = utilisateurRepository.findById(principal.getId())
            .orElseThrow(() -> new RuntimeException("Compte introuvable"));
        // L'identifiant du compte ne doit plus apparaître dans le nom de fichier : il
        // rendait les photos des autres utilisateurs devinables par incrémentation.
        String chemin = stockage.enregistrer(fichier, "photos",
                StockageFichierService.Categorie.IMAGE).url();
        if ("passeport".equalsIgnoreCase(type)) {
            u.setPhotoPasseport(chemin);
        } else {
            u.setPhotoProfil(chemin);
        }
        utilisateurRepository.save(u);
        Map<String, String> photos = new HashMap<>();
        photos.put("photoProfil", u.getPhotoProfil());
        photos.put("photoPasseport", u.getPhotoPasseport());
        return photos;
    }

    /** Photos actuelles du compte connecté. */
    public Map<String, String> mesPhotos(Utilisateur principal) {
        Utilisateur u = utilisateurRepository.findById(principal.getId())
            .orElseThrow(() -> new RuntimeException("Compte introuvable"));
        Map<String, String> photos = new HashMap<>();
        photos.put("photoProfil", u.getPhotoProfil());
        photos.put("photoPasseport", u.getPhotoPasseport());
        return photos;
    }

    private String genererMotDePasseTemporaire() {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        java.security.SecureRandom alea = new java.security.SecureRandom();
        StringBuilder mdp = new StringBuilder("Gn-");
        for (int i = 0; i < 9; i++) mdp.append(alphabet.charAt(alea.nextInt(alphabet.length())));
        return mdp.toString();
    }
}
