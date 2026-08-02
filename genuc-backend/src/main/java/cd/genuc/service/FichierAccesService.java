package cd.genuc.service;

import cd.genuc.model.DossierInscription;
import cd.genuc.model.Inscription;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.CandidatureBourseRepository;
import cd.genuc.repository.ChapitreTfcRepository;
import cd.genuc.repository.DocumentEtudiantRepository;
import cd.genuc.repository.DossierInscriptionRepository;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.repository.RecoursRepository;
import cd.genuc.repository.SoumissionTravailRepository;
import cd.genuc.repository.StageRepository;
import cd.genuc.repository.UtilisateurRepository;
import cd.genuc.security.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Décide si un utilisateur authentifié a le droit de télécharger un fichier privé.
 *
 * <p>Avant, tout le dossier {@code uploads/} était servi en statique et ouvert en
 * {@code permitAll} : il suffisait de connaître (ou deviner, ou récupérer dans un
 * historique de navigation, un log de proxy ou un lien partagé) l'URL d'une pièce de
 * dossier pour lire l'acte de naissance ou la carte d'identité d'un candidat, sans
 * aucun compte.</p>
 *
 * <p>Désormais seules les ressources de marque restent publiques. Tout le reste passe
 * par {@code /api/fichiers/**}, qui interroge ce service : on remonte du fichier vers
 * son propriétaire (dossier, inscription ou compte), puis on applique les mêmes règles
 * que partout ailleurs via {@link SecurityService}.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FichierAccesService {

    /**
     * Sous-dossiers de {@code uploads/} servis publiquement, sans authentification.
     * Uniquement de l'identité visuelle affichée sur des pages publiques : un
     * {@code <img src>} n'envoie jamais le jeton JWT.
     * <b>Aucune donnée personnelle ne doit être écrite dans ces dossiers.</b>
     */
    public static final Set<String> DOSSIERS_PUBLICS = Set.of("universites", "logos", "certificats");

    private final SecurityService securityService;
    private final InscriptionRepository inscriptionRepository;
    private final DossierInscriptionRepository dossierRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final SoumissionTravailRepository soumissionRepository;
    private final StageRepository stageRepository;
    private final RecoursRepository recoursRepository;
    private final ChapitreTfcRepository chapitreTfcRepository;
    private final CandidatureBourseRepository candidatureBourseRepository;
    private final DocumentEtudiantRepository documentEtudiantRepository;

    /** Rôles habilités à consulter les pièces administratives de LEUR université. */
    private static final Set<RoleEnum> ROLES_ADMINISTRATIFS = Set.of(
            RoleEnum.ADMIN_UNIVERSITE, RoleEnum.UNIVERSITY_ADMIN,
            RoleEnum.SECRETAIRE_ACADEMIQUE, RoleEnum.REGISTRAR,
            RoleEnum.RECTEUR, RoleEnum.DOYEN, RoleEnum.DEAN,
            RoleEnum.CHEF_DEPARTEMENT, RoleEnum.DEPARTMENT_HEAD,
            RoleEnum.APPARITEUR, RoleEnum.SERVICE_SOCIAL,
            RoleEnum.AGENT, RoleEnum.CAISSIER, RoleEnum.COMPTABLE);

    /**
     * @param sousDossier sous-dossier de {@code uploads/} (ex. {@code "dossiers"})
     * @param url         URL telle que stockée en base ({@code /uploads/<sousDossier>/<nom>})
     * @param demandeur   utilisateur authentifié
     */
    public boolean peutTelecharger(String sousDossier, String url, Utilisateur demandeur) {
        if (demandeur == null || demandeur.getRole() == null) {
            return false;
        }
        RoleEnum role = demandeur.getRole();
        if (role == RoleEnum.SUPER_ADMIN || role == RoleEnum.ADMIN_SYSTEME) {
            return true;
        }

        return switch (sousDossier.toLowerCase(Locale.ROOT)) {
            case "dossiers"              -> accesPieceDossier(url, demandeur);
            case "photos"                -> accesPhoto(url, demandeur);
            case "travaux"               -> accesTravaux(url, demandeur);
            case "tfc"                   -> accesTfc(url, demandeur);
            case "stages"                -> accesStage(url, demandeur);
            case "recours"               -> accesRecours(url, demandeur);
            case "bourses"               -> accesBourse(url, demandeur);
            case "documents"             -> accesDocumentEtudiant(url, demandeur);
            // Documents institutionnels et cartes générées : pas de propriétaire
            // individuel exploitable, réservés au personnel de l'établissement.
            case "universites-documents",
                 "cartes"                -> estAdministratif(demandeur);
            // Tout dossier non explicitement traité est refusé : un nouveau type de
            // fichier doit être décrit ici avant d'être téléchargeable.
            default -> {
                log.warn("Téléchargement refusé : sous-dossier « {} » sans règle d'accès (demandeur {})",
                        sousDossier, demandeur.getEmail());
                yield false;
            }
        };
    }

    // ══════════════════════════════════════════
    // Règles par type de fichier
    // ══════════════════════════════════════════

    private boolean accesPieceDossier(String url, Utilisateur demandeur) {
        List<DossierInscription> dossiers = dossierRepository.findByUrlPiece(url);
        if (dossiers.isEmpty()) {
            return false;
        }
        DossierInscription dossier = dossiers.get(0);

        // Le candidat lui-même (le dossier est déposé avant tout compte : le lien est l'email).
        if (memeEmail(demandeur.getEmail(), dossier.getEmail())) {
            return true;
        }
        // Le personnel de l'établissement destinataire du dossier.
        return estAdministratif(demandeur)
                && dossier.getUniversiteId() != null
                && dossier.getUniversiteId().equals(demandeur.getUniversiteId());
    }

    private boolean accesPhoto(String url, Utilisateur demandeur) {
        List<Utilisateur> proprietaires = utilisateurRepository.findByPhoto(url);
        if (proprietaires.isEmpty()) {
            return false;
        }
        Utilisateur proprietaire = proprietaires.get(0);
        if (proprietaire.getId().equals(demandeur.getId())) {
            return true;
        }
        return estAdministratif(demandeur)
                && proprietaire.getUniversiteId() != null
                && proprietaire.getUniversiteId().equals(demandeur.getUniversiteId());
    }

    private boolean accesTravaux(String url, Utilisateur demandeur) {
        return soumissionRepository.findByFichierUrl(url).stream()
                .filter(s -> s.getInscription() != null)
                .anyMatch(s -> securityService.peutAccederInscription(s.getInscription().getId()));
    }

    private boolean accesTfc(String url, Utilisateur demandeur) {
        return chapitreTfcRepository.findByUrl(url).stream()
                .filter(c -> c.getTfc() != null && c.getTfc().getInscription() != null)
                .anyMatch(c -> securityService.peutAccederInscription(c.getTfc().getInscription().getId()));
    }

    private boolean accesStage(String url, Utilisateur demandeur) {
        return stageRepository.findByConventionUrlOrRapportUrl(url, url).stream()
                .filter(s -> s.getInscription() != null)
                .anyMatch(s -> securityService.peutAccederInscription(s.getInscription().getId()));
    }

    private boolean accesRecours(String url, Utilisateur demandeur) {
        return recoursRepository.findByPieceJointeUrl(url).stream()
                .filter(r -> r.getInscription() != null)
                .anyMatch(r -> securityService.peutAccederInscription(r.getInscription().getId()));
    }

    private boolean accesBourse(String url, Utilisateur demandeur) {
        return candidatureBourseRepository.findByPieceJustificativeUrl(url).stream()
                .filter(c -> c.getEtudiant() != null)
                .anyMatch(c -> accesParEtudiant(c.getEtudiant().getId()));
    }

    private boolean accesDocumentEtudiant(String url, Utilisateur demandeur) {
        return documentEtudiantRepository.findByUrl(url).stream()
                .filter(d -> d.getEtudiant() != null)
                .anyMatch(d -> accesParEtudiant(d.getEtudiant().getId()));
    }

    // ══════════════════════════════════════════
    // Interne
    // ══════════════════════════════════════════

    /**
     * Certains fichiers sont rattachés à l'étudiant et non à une inscription précise.
     * On autorise dès qu'UNE des inscriptions de cet étudiant est accessible au demandeur
     * (son propre dossier, ou un dossier de son université pour le personnel).
     */
    private boolean accesParEtudiant(Long etudiantId) {
        if (etudiantId == null) {
            return false;
        }
        return inscriptionRepository.findByEtudiant_Id(etudiantId).stream()
                .map(Inscription::getId)
                .anyMatch(securityService::peutAccederInscription);
    }

    private boolean estAdministratif(Utilisateur u) {
        return u.getRole() != null && ROLES_ADMINISTRATIFS.contains(u.getRole());
    }

    private boolean memeEmail(String a, String b) {
        return a != null && b != null && !a.isBlank()
                && a.trim().equalsIgnoreCase(b.trim());
    }
}
