package cd.genuc.service;

import cd.genuc.dto.InscriptionRequest;
import cd.genuc.exception.BusinessException;
import cd.genuc.exception.InscriptionNotFoundException;
import cd.genuc.exception.ResourceNotFoundException;
import cd.genuc.exception.UniversiteNotFoundException;
import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InscriptionService {

    private final InscriptionRepository inscriptionRepo;
    private final UniversiteRepository universiteRepository;
    private final EtudiantRepository etudiantRepository;
    private final FiliereRepository filiereRepository;
    private final PromotionRepository promotionRepository;
    private final AnneeAcademiqueRepository anneeRepository;
    private final DepartementRepository departementRepository;

    @Transactional
    public Inscription soumettre(InscriptionRequest request) {
        if (request.getUniversiteId() == null || request.getDepartementId() == null ||
            request.getEtudiantId() == null || request.getFiliereId() == null ||
            request.getPromotionId() == null || request.getAnneeAcademiqueId() == null) {
            throw new BusinessException("Tous les champs sont obligatoires.");
        }

        Universite universite = universiteRepository.findById(request.getUniversiteId())
                .orElseThrow(() -> new UniversiteNotFoundException(request.getUniversiteId()));
        Departement departement = departementRepository.findById(request.getDepartementId())
                .orElseThrow(() -> new ResourceNotFoundException("Departement", request.getDepartementId()));
        Filiere filiere = filiereRepository.findById(request.getFiliereId())
                .orElseThrow(() -> new ResourceNotFoundException("Filiere", request.getFiliereId()));
        Promotion promotion = promotionRepository.findById(request.getPromotionId())
                .orElseThrow(() -> new ResourceNotFoundException("Promotion", request.getPromotionId()));
        AnneeAcademique annee = anneeRepository.findById(request.getAnneeAcademiqueId())
                .orElseThrow(() -> new ResourceNotFoundException("AnneeAcademique", request.getAnneeAcademiqueId()));
        Etudiant etudiant = etudiantRepository.findById(request.getEtudiantId())
                .orElseThrow(() -> new ResourceNotFoundException("Etudiant", request.getEtudiantId()));

        if (!universite.isInscriptionsOuvertes()) {
            throw new BusinessException("INSCRIPTIONS_FERMEES", "Les inscriptions sont fermées pour cette université.");
        }
        if (!departement.getUniversite().getId().equals(universite.getId())) {
            throw new BusinessException("DEPARTEMENT_UNIVERSITE_MISMATCH", "Le département ne correspond pas à l'université sélectionnée.");
        }

        Inscription inscription = Inscription.builder()
            .nom(etudiant.getNom())
            .prenom(etudiant.getPrenom())
            .email(etudiant.getEmail())
            .telephone(etudiant.getTelephone())
            .sexe(etudiant.getSexe())
            .dateNaissance(etudiant.getDateNaissance())
            .lieuNaissance(etudiant.getLieuNaissance())
            .adresse(etudiant.getAdresse())
            .niveau(promotion.getLibelle())
            .etudiant(etudiant)
            .universite(universite)
            .departement(departement)
            .filiere(filiere)
            .promotion(promotion)
            .anneeAcademique(annee)
            .statut(StatutInscription.EN_ATTENTE)
            .bulletin(false)
            .photo(false)
            .acte(false)
            .matricule(genererMatricule(universite, annee))
            .build();

        return inscriptionRepo.save(inscription);
    }

    @Transactional
    public Inscription creerDepuisDossier(DossierInscription dossier, Etudiant etudiant, 
                                           Universite universite, Departement departement,
                                           Filiere filiere, Promotion promotion, 
                                           AnneeAcademique annee, String matricule) {
        
        Inscription inscription = Inscription.builder()
            .nom(dossier.getNom())
            .prenom(dossier.getPrenom())
            .email(dossier.getEmail())
            .telephone(dossier.getTelephone())
            .sexe(dossier.getSexe())
            .dateNaissance(dossier.getDateNaissance())
            .lieuNaissance(dossier.getLieuNaissance())
            .adresse(dossier.getAdresse())
            .niveau(dossier.getNiveauVise())
            .etudiant(etudiant)
            .universite(universite)
            .departement(departement)
            .filiere(filiere)
            .promotion(promotion)
            .anneeAcademique(annee)
            .matricule(matricule)
            .statut(StatutInscription.VALIDE)
            .bulletin(false)
            .photo(false)
            .acte(false)
            .commentaire("Créé via validation de dossier #" + dossier.getNumeroDossier())
            .build();

        return inscriptionRepo.save(inscription);
    }

    @Transactional
    public Inscription reinscrire(Long ancienneInscriptionId, AnneeAcademique nouvelleAnnee, 
                                   Promotion nouvellePromotion, boolean avecDette) {
        
        Inscription ancienne = inscriptionRepo.findById(ancienneInscriptionId)
            .orElseThrow(() -> new InscriptionNotFoundException(ancienneInscriptionId));

        Etudiant etudiant = ancienne.getEtudiant();
        
        Inscription nouvelle = Inscription.builder()
            .nom(etudiant.getNom())
            .prenom(etudiant.getPrenom())
            .email(etudiant.getEmail())
            .telephone(etudiant.getTelephone())
            .sexe(etudiant.getSexe())
            .dateNaissance(etudiant.getDateNaissance())
            .lieuNaissance(etudiant.getLieuNaissance())
            .adresse(etudiant.getAdresse())
            .niveau(nouvellePromotion.getLibelle())
            .etudiant(etudiant)
            .universite(ancienne.getUniversite())
            .departement(ancienne.getDepartement())
            .filiere(ancienne.getFiliere())
            .promotion(nouvellePromotion)
            .anneeAcademique(nouvelleAnnee)
            .statut(StatutInscription.EN_ATTENTE)
            .bulletin(false)
            .photo(false)
            .acte(false)
            .commentaire(avecDette ? "Réinscription avec dette de l'année précédente" : "Réinscription")
            .matricule(genererMatricule(ancienne.getUniversite(), nouvelleAnnee))
            .build();

        return inscriptionRepo.save(nouvelle);
    }

    public Inscription obtenir(Long id) {
        return inscriptionRepo.findById(id)
            .orElseThrow(() -> new InscriptionNotFoundException(id));
    }

    public Optional<Inscription> trouverParMatricule(String matricule) {
        return inscriptionRepo.findByMatricule(matricule);
    }

    public List<Inscription> inscriptionsParEtudiant(Long etudiantId) {
        return inscriptionRepo.findByEtudiant_Id(etudiantId);
    }

    public List<Inscription> inscriptionsParUniversite(Long universiteId) {
        return inscriptionRepo.findByUniversite_Id(universiteId);
    }

    public List<Inscription> inscriptionsParUniversiteEtStatut(Long universiteId, StatutInscription statut) {
        return inscriptionRepo.findByUniversiteIdAndStatut(universiteId, statut);
    }

    public List<Inscription> inscriptionsParDepartement(Long departementId) {
        return inscriptionRepo.findByDepartement_Id(departementId);
    }

    public Optional<Inscription> inscriptionActiveParEtudiant(Long etudiantId) {
        return inscriptionRepo.findByEtudiantIdAndStatut(etudiantId, StatutInscription.VALIDE);
    }

    @Transactional
    public Inscription valider(Long id, String commentaire) {
        Inscription inscription = obtenir(id);
        
        if (inscription.getStatut() != StatutInscription.EN_ATTENTE) {
            throw new BusinessException("STATUT_INVALIDE", "Seules les inscriptions en attente peuvent être validées");
        }
        
        inscription.setStatut(StatutInscription.VALIDE);
        if (commentaire != null) {
            inscription.setCommentaire(commentaire);
        }
        
        return inscriptionRepo.save(inscription);
    }

    @Transactional
    public Inscription rejeter(Long id, String motif) {
        Inscription inscription = obtenir(id);
        
        if (inscription.getStatut() != StatutInscription.EN_ATTENTE) {
            throw new BusinessException("STATUT_INVALIDE", "Seules les inscriptions en attente peuvent être rejetées");
        }
        
        inscription.setStatut(StatutInscription.REJETE);
        inscription.setMotifRejet(motif);
        
        return inscriptionRepo.save(inscription);
    }

    public Map<String, Object> statistiquesParUniversite(Long universiteId, String anneeLibelle) {
        // L'année est cherchée DANS cet établissement : l'unicité porte sur
        // (libelle, universite_id). Sur le seul libellé, la requête rendait
        // plusieurs lignes dès le deuxième établissement raccordé — et, avant
        // d'échouer, aurait pu retenir l'année d'autrui, dont l'identifiant
        // sert juste après à compter les inscriptions.
        Universite universite = universiteRepository.findById(universiteId)
            .orElseThrow(() -> new BusinessException("Établissement introuvable : " + universiteId));
        AnneeAcademique annee = anneeRepository.findByLibelleAndUniversite(anneeLibelle, universite)
            .orElseThrow(() -> new BusinessException(
                "Année académique introuvable pour cet établissement : " + anneeLibelle));
        
        long total = inscriptionRepo.countByUniversite_IdAndAnneeAcademique_Id(universiteId, annee.getId());
        long validees = inscriptionRepo.findByUniversiteIdAndStatut(universiteId, StatutInscription.VALIDE).size();
        long enAttente = inscriptionRepo.findByUniversiteIdAndStatut(universiteId, StatutInscription.EN_ATTENTE).size();
        long rejetees = inscriptionRepo.findByUniversiteIdAndStatut(universiteId, StatutInscription.REJETE).size();
   
        return Map.of(
            "universiteId", universiteId,
            "anneeAcademique", anneeLibelle,
            "total", total,
            "validees", validees,
            "enAttente", enAttente,
            "rejetees", rejetees,
            "tauxValidation", total > 0 ? Math.round((double) validees / total * 100) : 0
        );
    }

    public long compterInscriptionsParUniversiteEtAnnee(Long universiteId, Long anneeId) {
        return inscriptionRepo.countByUniversite_IdAndAnneeAcademique_Id(universiteId, anneeId);
    }

    private String genererMatricule(Universite universite, AnneeAcademique annee) {
        String codeUni = universite.getCode().toUpperCase().replaceAll("[^A-Z0-9]", "");
        String libelleAnnee = annee.getLibelle();
        String anneeStr = "2026"; 
        if (libelleAnnee != null && libelleAnnee.contains("-")) {
            anneeStr = libelleAnnee.split("-")[0].trim().replaceAll("[^0-9]", "");
        } else if (libelleAnnee != null) {
            anneeStr = libelleAnnee.trim().replaceAll("[^0-9]", "");
        }
        
        long totalInscriptions = inscriptionRepo.countByUniversite_IdAndAnneeAcademique_Id(universite.getId(), annee.getId());
        long prochaineSequence = totalInscriptions + 1;
        
        return String.format("%s%s%05d", codeUni, anneeStr, prochaineSequence);
    }
}