package cd.genuc.service;

import cd.genuc.model.Departement;
import cd.genuc.model.Filiere;
import cd.genuc.model.Filiere.NiveauFiliere;
import cd.genuc.model.StatutInscription;
import cd.genuc.repository.DepartementRepository;
import cd.genuc.repository.FiliereRepository;
import cd.genuc.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DepartementService {

    private final DepartementRepository departementRepo;
    private final FiliereRepository filiereRepo;
    private final InscriptionRepository inscriptionRepo;

    public Departement obtenir(Long id) {
        return departementRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Département introuvable : id=" + id));
    }

    public List<Departement> listerParUniversite(Long universiteId) {
        return departementRepo.findByUniversiteIdAndActifTrue(universiteId);
    }

    public List<Departement> listerTousActifs() {
        return departementRepo.findAllActifs();
    }

    public long compterParUniversite(Long universiteId) {
        return departementRepo.countByUniversiteIdAndActifTrue(universiteId);
    }

    public List<Filiere> listerFilieres(Long departementId) {
        return filiereRepo.findByDepartementIdAndActifTrue(departementId);
    }

    public Filiere obtenirFiliere(Long id) {
        return filiereRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Filière introuvable : id=" + id));
    }

    @Transactional
    public Filiere creerFiliere(Long departementId, Map<String, Object> data) {
        Departement dept = obtenir(departementId);
        String nom = (String) data.get("nom");
        
        if (filiereRepo.existsByNomAndDepartementId(nom, departementId)) {
            throw new RuntimeException("Une filière avec ce nom existe déjà dans ce département");
        }
        
        NiveauFiliere niveau = NiveauFiliere.LICENCE;
        if (data.containsKey("niveau") && data.get("niveau") != null) {
            try {
                niveau = NiveauFiliere.valueOf((String) data.get("niveau"));
            } catch (IllegalArgumentException e) {
                niveau = NiveauFiliere.LICENCE;
            }
        }
        
        Filiere filiere = Filiere.builder()
            .nom(nom)
            .description((String) data.get("description"))
            .code((String) data.get("code"))
            .niveau(niveau)
            .dureeAnnees(data.get("dureeAnnees") != null
                ? Integer.valueOf(data.get("dureeAnnees").toString()) : 3)
            .creditsTotal(data.get("creditsTotal") != null
                ? Integer.valueOf(data.get("creditsTotal").toString()) : 180)
            .conditionsAdmission((String) data.get("conditionsAdmission"))
            .documentsRequis((String) data.get("documentsRequis"))
            .departement(dept)
            .actif(true)
            .build();

        return filiereRepo.save(filiere);
    }

    @Transactional
    public Filiere modifierFiliere(Long id, Map<String, Object> data) {
        Filiere filiere = obtenirFiliere(id);
        
        if (data.containsKey("nom")) filiere.setNom((String) data.get("nom"));
        if (data.containsKey("description")) filiere.setDescription((String) data.get("description"));
        if (data.containsKey("code")) filiere.setCode((String) data.get("code"));
        
        if (data.containsKey("niveau") && data.get("niveau") != null) {
            try {
                filiere.setNiveau(NiveauFiliere.valueOf((String) data.get("niveau")));
            } catch (IllegalArgumentException e) {
                // Ignorer
            }
        }
        
        if (data.containsKey("dureeAnnees"))
            filiere.setDureeAnnees(Integer.valueOf(data.get("dureeAnnees").toString()));
        if (data.containsKey("creditsTotal"))
            filiere.setCreditsTotal(Integer.valueOf(data.get("creditsTotal").toString()));
        if (data.containsKey("conditionsAdmission"))
            filiere.setConditionsAdmission((String) data.get("conditionsAdmission"));
        if (data.containsKey("documentsRequis"))
            filiere.setDocumentsRequis((String) data.get("documentsRequis"));

        return filiereRepo.save(filiere);
    }

    @Transactional
    public void desactiverFiliere(Long id) {
        Filiere filiere = obtenirFiliere(id);
        filiere.setActif(false);
        filiereRepo.save(filiere);
    }

    public Map<String, Object> statistiques(Long departementId) {
        Departement dept = obtenir(departementId);
        long nbFilieres = filiereRepo.countByDepartementIdAndActifTrue(departementId);
        long nbEtudiants = inscriptionRepo.countByDepartementIdAndStatut(departementId, StatutInscription.VALIDE);

        return Map.of(
            "id", dept.getId(),
            "nom", dept.getNom(),
            "code", dept.getCode(),
            "type", dept.getType() != null ? dept.getType().name() : "DEPARTEMENT",
            "nbFilieres", nbFilieres,
            "nbEtudiants", nbEtudiants,
            "universite", Map.of(
                "id", dept.getUniversite().getId(),
                "nom", dept.getUniversite().getNom(),
                "code", dept.getUniversite().getCode()
            )
        );
    }
}