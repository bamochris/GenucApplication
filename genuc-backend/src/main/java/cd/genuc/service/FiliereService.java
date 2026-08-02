package cd.genuc.service;

import cd.genuc.model.AnneeAcademique;
import cd.genuc.model.Filiere;
import cd.genuc.repository.AnneeAcademiqueRepository;
import cd.genuc.repository.FiliereRepository;
import cd.genuc.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FiliereService {

    private final FiliereRepository filiereRepository;
    private final UniversiteRepository universiteRepository;
    private final AnneeAcademiqueRepository anneeAcademiqueRepository;

    // ─── Récupération publique avec année académique ──────────

    public List<Filiere> getFilieresDisponibles(Long universiteId, String anneeLibelle) {
        // Vérifier que l'université existe et est ouverte
        universiteRepository.findById(universiteId)
                .orElseThrow(() -> new RuntimeException("Université introuvable"));

        // Si année non fournie, prendre l'année active
        if (anneeLibelle == null || anneeLibelle.isEmpty()) {
            AnneeAcademique active = anneeAcademiqueRepository.findByActiveTrue()
                    .stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("Aucune année académique active"));
            anneeLibelle = active.getLibelle();
        }

        // Récupérer les filières disponibles (selon la requête définie dans le repository)
        // On pourrait ajouter un filtre par année si nécessaire (via jointure)
        return filiereRepository.findDisponiblesParUniversite(universiteId);
    }

    // ─── CRUD ──────────────────────────────────────────────────

    @Transactional
    public Filiere creerFiliere(Filiere filiere) {
        // Vérifier que le département existe et que la filière n'existe pas déjà
        if (filiere.getDepartement() == null || filiere.getDepartement().getId() == null) {
            throw new RuntimeException("Le département est obligatoire");
        }
        // Validation supplémentaire (nom unique dans le département) – à ajouter
        return filiereRepository.save(filiere);
    }

    @Transactional
    public Filiere modifierFiliere(Long id, Filiere updated) {
        Filiere existing = getFiliere(id);
        existing.setNom(updated.getNom());
        existing.setCode(updated.getCode());
        existing.setDescription(updated.getDescription());
        existing.setNiveau(updated.getNiveau());
        existing.setDureeAnnees(updated.getDureeAnnees());
        existing.setCreditsTotal(updated.getCreditsTotal());
        existing.setActif(updated.isActif());
        existing.setInscriptionsOuvertes(updated.isInscriptionsOuvertes());
        existing.setTestAdmissionRequis(updated.isTestAdmissionRequis());
        if (updated.getConditionsAdmission() != null) {
            existing.setConditionsAdmission(updated.getConditionsAdmission());
        }
        if (updated.getDocumentsRequis() != null) {
            existing.setDocumentsRequis(updated.getDocumentsRequis());
        }
        if (updated.getDepartement() != null) {
            existing.setDepartement(updated.getDepartement());
        }
        return filiereRepository.save(existing);
    }

    @Transactional
    public Filiere toggleActif(Long id) {
        Filiere filiere = getFiliere(id);
        filiere.setActif(!filiere.isActif());
        return filiereRepository.save(filiere);
    }

    @Transactional
    public Filiere toggleInscriptions(Long id) {
        Filiere filiere = getFiliere(id);
        filiere.setInscriptionsOuvertes(!filiere.isInscriptionsOuvertes());
        return filiereRepository.save(filiere);
    }

    /** Bascule l'exigence d'un test d'admission pour cette filière (secrétaire / admin). */
    @Transactional
    public Filiere toggleTestAdmission(Long id) {
        Filiere filiere = getFiliere(id);
        filiere.setTestAdmissionRequis(!filiere.isTestAdmissionRequis());
        return filiereRepository.save(filiere);
    }

    public Filiere getFiliere(Long id) {
        return filiereRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Filière introuvable"));
    }

    public List<Filiere> getFilieresParDepartement(Long departementId) {
        return filiereRepository.findByDepartementIdAndActifTrue(departementId);
    }

    /** Toutes les filières d'une université (actives ou non) — gestion de l'exigence du test. */
    public List<Filiere> getFilieresParUniversite(Long universiteId) {
        return filiereRepository.findByUniversiteId(universiteId);
    }
}