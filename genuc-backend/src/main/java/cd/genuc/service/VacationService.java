package cd.genuc.service;

import cd.genuc.dto.CoursVacationDTO;
import cd.genuc.dto.InscriptionVacationDTO;
import cd.genuc.dto.VacationDTO;
import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VacationService {

    private final VacationRepository vacationRepo;
    private final CoursVacationRepository coursVacationRepo;
    private final InscriptionVacationRepository inscriptionVacationRepo;
    private final UniversiteRepository universiteRepo;
    private final AnneeAcademiqueRepository anneeAcademiqueRepo;
    private final EtudiantRepository etudiantRepo;
    private final PromotionRepository promotionRepo;
    private final CoursRepository coursRepo;
    private final InscriptionRepository inscriptionRepo;

    // ══════════════════════════════════════════
    // VACATION — CRUD
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<VacationDTO> listerParUniversite(Long universiteId) {
        return vacationRepo.findByUniversiteId(universiteId)
                .stream().map(VacationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VacationDTO> listerActives(Long universiteId) {
        return vacationRepo.findByUniversiteIdAndActifTrue(universiteId)
                .stream().map(VacationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VacationDTO> listerParType(Long universiteId, TypeVacation type) {
        return vacationRepo.findByUniversiteIdAndType(universiteId, type)
                .stream().map(VacationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VacationDTO> listerInscriptionsOuvertes(Long universiteId) {
        return vacationRepo.findInscriptionsOuvertes(universiteId, LocalDate.now())
                .stream().map(VacationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VacationDTO getById(Long id) {
        Vacation v = vacationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vacation non trouvée : " + id));
        return VacationDTO.fromEntity(v);
    }

    @Transactional
    public VacationDTO creer(Vacation vacation, Long universiteId, Long anneeAcademiqueId) {
        Universite u = universiteRepo.findById(universiteId)
                .orElseThrow(() -> new RuntimeException("Université non trouvée : " + universiteId));
        AnneeAcademique aa = anneeAcademiqueRepo.findById(anneeAcademiqueId)
                .orElseThrow(() -> new RuntimeException("Année académique non trouvée : " + anneeAcademiqueId));

        vacation.setUniversite(u);
        vacation.setAnneeAcademique(aa);
        vacation.setActif(true);
        vacation.setInscriptionsOuvertes(true);

        return VacationDTO.fromEntity(vacationRepo.save(vacation));
    }

    @Transactional
    public VacationDTO modifier(Long id, Vacation update) {
        Vacation v = vacationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vacation non trouvée : " + id));
        if (update.getNom() != null)
            v.setNom(update.getNom());
        if (update.getType() != null)
            v.setType(update.getType());
        if (update.getDescription() != null)
            v.setDescription(update.getDescription());
        if (update.getDateDebut() != null)
            v.setDateDebut(update.getDateDebut());
        if (update.getDateFin() != null)
            v.setDateFin(update.getDateFin());
        if (update.getFraisInscription() != null)
            v.setFraisInscription(update.getFraisInscription());
        if (update.getCapaciteMax() != null)
            v.setCapaciteMax(update.getCapaciteMax());
        if (update.getDeviseFrais() != null)
            v.setDeviseFrais(update.getDeviseFrais());
        return VacationDTO.fromEntity(vacationRepo.save(v));
    }

    @Transactional
    public void ouvrirInscriptions(Long id) {
        Vacation v = vacationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vacation non trouvée : " + id));
        // RDC : le frais d'inscription doit être défini avant d'ouvrir les inscriptions.
        if (v.getFraisInscription() == null || v.getFraisInscription() <= 0) {
            throw new RuntimeException("Définissez d'abord les frais d'inscription de cette vacation avant d'ouvrir les inscriptions.");
        }
        v.setInscriptionsOuvertes(true);
        vacationRepo.save(v);
    }

    @Transactional
    public void fermerInscriptions(Long id) {
        Vacation v = vacationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vacation non trouvée : " + id));
        v.setInscriptionsOuvertes(false);
        vacationRepo.save(v);
    }

    @Transactional
    public void archiver(Long id) {
        Vacation v = vacationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vacation non trouvée : " + id));
        v.setActif(false);
        v.setInscriptionsOuvertes(false);
        vacationRepo.save(v);
    }

    @Transactional
    public void supprimer(Long id) {
        vacationRepo.deleteById(id);
    }

    // ══════════════════════════════════════════
    // COURS VACATION
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<CoursVacationDTO> listerCours(Long vacationId) {
        return coursVacationRepo.findByVacationId(vacationId)
                .stream().map(CoursVacationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CoursVacationDTO> listerCoursParProfesseur(Long professeurId) {
        return coursVacationRepo.findByProfesseurId(professeurId)
                .stream().map(CoursVacationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CoursVacationDTO> listerCoursParPromotion(Long vacationId, Long promotionId) {
        return coursVacationRepo.findByVacationIdAndPromotionId(vacationId, promotionId)
                .stream().map(CoursVacationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public CoursVacationDTO ajouterCours(CoursVacation coursVacation, Long vacationId,
            Long coursId, Long professeurId, Long promotionId) {
        Vacation v = vacationRepo.findById(vacationId)
                .orElseThrow(() -> new RuntimeException("Vacation non trouvée : " + vacationId));
        Cours c = coursRepo.findById(coursId)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé : " + coursId));
        Promotion p = promotionRepo.findById(promotionId)
                .orElseThrow(() -> new RuntimeException("Promotion non trouvée : " + promotionId));

        coursVacation.setVacation(v);
        coursVacation.setCours(c);
        coursVacation.setPromotion(p);
        coursVacation.setActif(true);

        if (professeurId != null) {
            // Note: professeur est un Utilisateur avec le rôle PROFESSEUR
            coursVacation.setProfesseur(Utilisateur.builder().id(professeurId).build());
        }

        return CoursVacationDTO.fromEntity(coursVacationRepo.save(coursVacation));
    }

    @Transactional
    public void supprimerCours(Long coursVacationId) {
        coursVacationRepo.deleteById(coursVacationId);
    }

    // ══════════════════════════════════════════
    // INSCRIPTIONS VACATION (ÉTUDIANTS)
    // ══════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<InscriptionVacationDTO> listerInscriptions(Long vacationId) {
        return inscriptionVacationRepo.findByVacationId(vacationId)
                .stream().map(InscriptionVacationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InscriptionVacationDTO> listerInscriptionsParEtudiant(Long etudiantId) {
        return inscriptionVacationRepo.findByEtudiantId(etudiantId)
                .stream().map(InscriptionVacationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InscriptionVacationDTO> listerInscriptionsEtudiantParAnnee(Long etudiantId, Long anneeAcademiqueId) {
        return inscriptionVacationRepo.findByEtudiantIdAndAnneeAcademiqueId(etudiantId, anneeAcademiqueId)
                .stream().map(InscriptionVacationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public InscriptionVacationDTO inscrireEtudiant(Long vacationId, Long etudiantId,
            Long promotionId, Long anneeAcademiqueId) {
        // Vérifier si déjà inscrit
        if (inscriptionVacationRepo.existsByVacationIdAndEtudiantId(vacationId, etudiantId)) {
            throw new RuntimeException("L'étudiant est déjà inscrit à cette vacation");
        }

        Vacation v = vacationRepo.findById(vacationId)
                .orElseThrow(() -> new RuntimeException("Vacation non trouvée : " + vacationId));

        if (!v.isInscriptionsOuvertes()) {
            throw new RuntimeException("Les inscriptions pour cette vacation sont fermées");
        }

        if (v.getCapaciteMax() != null && v.getNbEtudiantsInscrits() >= v.getCapaciteMax()) {
            throw new RuntimeException("La vacation a atteint sa capacité maximale");
        }

        Etudiant e = etudiantRepo.findById(etudiantId)
                .orElseThrow(() -> new RuntimeException("Étudiant non trouvé : " + etudiantId));
        Promotion p = promotionRepo.findById(promotionId)
                .orElseThrow(() -> new RuntimeException("Promotion non trouvée : " + promotionId));
        AnneeAcademique aa = anneeAcademiqueRepo.findById(anneeAcademiqueId)
                .orElseThrow(() -> new RuntimeException("Année académique non trouvée : " + anneeAcademiqueId));

        InscriptionVacation iv = InscriptionVacation.builder()
                .vacation(v)
                .etudiant(e)
                .promotion(p)
                .anneeAcademique(aa)
                .statut(StatutInscription.EN_ATTENTE)
                .build();

        return InscriptionVacationDTO.fromEntity(inscriptionVacationRepo.save(iv));
    }

    @Transactional
    public InscriptionVacationDTO validerInscription(Long inscriptionId) {
        InscriptionVacation iv = inscriptionVacationRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription vacation non trouvée : " + inscriptionId));
        iv.valider();
        return InscriptionVacationDTO.fromEntity(inscriptionVacationRepo.save(iv));
    }

    @Transactional
    public InscriptionVacationDTO rejeterInscription(Long inscriptionId, String motif) {
        InscriptionVacation iv = inscriptionVacationRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription vacation non trouvée : " + inscriptionId));
        iv.rejeter(motif);
        return InscriptionVacationDTO.fromEntity(inscriptionVacationRepo.save(iv));
    }

    @Transactional
    public void desinscrireEtudiant(Long inscriptionId) {
        inscriptionVacationRepo.deleteById(inscriptionId);
    }

    @Transactional(readOnly = true)
    public long compterInscriptions(Long vacationId) {
        return inscriptionVacationRepo.countByVacationId(vacationId);
    }
}
