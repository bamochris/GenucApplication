package cd.genuc.service;

import cd.genuc.dto.EquivalenceDiplomeDTO;
import cd.genuc.model.EquivalenceDiplome;
import cd.genuc.model.EquivalenceDiplome.StatutEquivalence;
import cd.genuc.model.Etudiant;
import cd.genuc.model.Filiere;
import cd.genuc.model.Inscription;
import cd.genuc.model.Universite;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.EquivalenceDiplomeRepository;
import cd.genuc.repository.EtudiantRepository;
import cd.genuc.repository.FiliereRepository;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.repository.UniversiteRepository;
import cd.genuc.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Demandes de reconnaissance d'équivalence de diplôme (étudiant venant d'un autre
 * établissement RDC ou étranger) — soumission par l'étudiant, décision par la
 * commission académique de l'université (admin/doyen/secrétaire académique).
 */
@Service
@RequiredArgsConstructor
public class EquivalenceDiplomeService {

    private final EquivalenceDiplomeRepository equivalenceRepo;
    private final EtudiantRepository etudiantRepo;
    private final UniversiteRepository universiteRepo;
    private final FiliereRepository filiereRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final InscriptionRepository inscriptionRepo;
    private final S3Service s3Service;

    /**
     * Résout l'{@link Etudiant} correspondant à un utilisateur connecté (Utilisateur → Inscription → Etudiant),
     * comme {@code RecoursService.resoudreInscription} — l'étudiant s'authentifie avec son compte
     * Utilisateur, pas directement avec l'id de l'entité Etudiant.
     */
    private Etudiant resoudreEtudiant(Long userId) {
        Utilisateur utilisateur = utilisateurRepo.findById(userId).orElse(null);
        Long inscriptionId = utilisateur != null ? utilisateur.getInscriptionId() : null;

        Inscription inscription = inscriptionId != null
                ? inscriptionRepo.findById(inscriptionId).orElse(null)
                : null;

        if (inscription != null && inscription.getEtudiant() != null) {
            return inscription.getEtudiant();
        }
        // Fallback : l'id transmis est peut-être déjà celui d'une entité Etudiant
        return etudiantRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Aucun étudiant associé à cet utilisateur"));
    }

    @Transactional
    public EquivalenceDiplomeDTO soumettre(Long userId, Long universiteId, EquivalenceDiplome demande,
                                            Long filiereDemandeeId, MultipartFile diplome, MultipartFile releveNotes)
            throws IOException {
        Etudiant etudiant = resoudreEtudiant(userId);
        Long etudiantId = etudiant.getId();
        Universite universite = universiteRepo.findById(universiteId)
                .orElseThrow(() -> new RuntimeException("Université introuvable : id=" + universiteId));

        if (demande.getEtablissementOrigine() == null || demande.getEtablissementOrigine().isBlank()) {
            throw new RuntimeException("L'établissement d'origine est obligatoire");
        }
        if (demande.getDiplomeObtenu() == null || demande.getDiplomeObtenu().isBlank()) {
            throw new RuntimeException("Le diplôme obtenu est obligatoire");
        }

        Filiere filiereDemandee = null;
        if (filiereDemandeeId != null) {
            filiereDemandee = filiereRepo.findById(filiereDemandeeId).orElse(null);
        }

        if (diplome == null || diplome.isEmpty()) {
            throw new RuntimeException("Le document du diplôme est obligatoire");
        }
        String diplomeKey = S3Service.cleEquivalenceDiplome(etudiantId, "diplome", diplome.getOriginalFilename());
        String diplomeUrl = s3Service.uploadFile(diplome.getBytes(), diplomeKey, diplome.getContentType(),
                diplome.getOriginalFilename() != null ? diplome.getOriginalFilename() : "diplome");

        String releveUrl = null;
        if (releveNotes != null && !releveNotes.isEmpty()) {
            String releveKey = S3Service.cleEquivalenceDiplome(etudiantId, "releve", releveNotes.getOriginalFilename());
            releveUrl = s3Service.uploadFile(releveNotes.getBytes(), releveKey, releveNotes.getContentType(),
                    releveNotes.getOriginalFilename() != null ? releveNotes.getOriginalFilename() : "releve");
        }

        demande.setId(null);
        demande.setEtudiant(etudiant);
        demande.setUniversite(universite);
        demande.setFiliereDemandee(filiereDemandee);
        demande.setDiplomeDocumentUrl(diplomeUrl);
        demande.setReleveNotesDocumentUrl(releveUrl);
        demande.setStatut(StatutEquivalence.EN_ATTENTE);
        demande.setDecisionMotif(null);
        demande.setNiveauAccorde(null);
        demande.setTraiteParId(null);
        demande.setDateDecision(null);

        return EquivalenceDiplomeDTO.fromEntity(equivalenceRepo.save(demande));
    }

    @Transactional(readOnly = true)
    public List<EquivalenceDiplomeDTO> listerParEtudiant(Long userId) {
        Etudiant etudiant = resoudreEtudiant(userId);
        return equivalenceRepo.findByEtudiantIdOrderByDateSoumissionDesc(etudiant.getId())
                .stream().map(EquivalenceDiplomeDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EquivalenceDiplomeDTO getById(Long id) {
        return EquivalenceDiplomeDTO.fromEntity(equivalenceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande d'équivalence introuvable : id=" + id)));
    }

    @Transactional(readOnly = true)
    public List<EquivalenceDiplomeDTO> listerPourCommission(Long universiteId, String statutFiltre) {
        StatutEquivalence statut = parseStatut(statutFiltre);
        List<EquivalenceDiplome> resultats = statut != null
                ? equivalenceRepo.findByUniversiteIdAndStatutOrderByDateSoumissionDesc(universiteId, statut)
                : equivalenceRepo.findByUniversiteIdOrderByDateSoumissionDesc(universiteId);
        return resultats.stream().map(EquivalenceDiplomeDTO::fromEntity).collect(Collectors.toList());
    }

    private StatutEquivalence parseStatut(String statut) {
        if (statut == null || statut.isBlank() || "TOUS".equalsIgnoreCase(statut)) return null;
        try {
            return StatutEquivalence.valueOf(statut);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Transactional
    public EquivalenceDiplomeDTO traiter(Long id, String statut, String decisionMotif, String niveauAccorde, Long traiteParId) {
        EquivalenceDiplome demande = equivalenceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande d'équivalence introuvable : id=" + id));

        StatutEquivalence nouveauStatut;
        try {
            nouveauStatut = StatutEquivalence.valueOf(statut);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Statut d'équivalence invalide : " + statut);
        }

        demande.setStatut(nouveauStatut);
        if (decisionMotif != null && !decisionMotif.isBlank()) {
            demande.setDecisionMotif(decisionMotif);
        }
        if (nouveauStatut == StatutEquivalence.APPROUVEE || nouveauStatut == StatutEquivalence.APPROUVEE_PARTIELLE) {
            demande.setNiveauAccorde(niveauAccorde != null && !niveauAccorde.isBlank()
                    ? niveauAccorde : demande.getNiveauDemande());
        }
        demande.setTraiteParId(traiteParId);
        demande.setDateDecision(LocalDateTime.now());

        return EquivalenceDiplomeDTO.fromEntity(equivalenceRepo.save(demande));
    }

    @Transactional
    public void annuler(Long id, Long userId) {
        EquivalenceDiplome demande = equivalenceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande d'équivalence introuvable : id=" + id));
        Etudiant etudiant = resoudreEtudiant(userId);

        if (!demande.getEtudiant().getId().equals(etudiant.getId())) {
            throw new RuntimeException("Vous ne pouvez annuler que vos propres demandes");
        }
        if (demande.getStatut() != StatutEquivalence.EN_ATTENTE) {
            throw new RuntimeException("Seule une demande en attente peut être annulée");
        }
        equivalenceRepo.delete(demande);
    }
}
