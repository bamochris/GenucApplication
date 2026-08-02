package cd.genuc.service;

import cd.genuc.model.CalendrierAcademique;
import cd.genuc.repository.CalendrierAcademiqueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendrierService {

    private final CalendrierAcademiqueRepository calendrierRepo;

    public List<CalendrierAcademique> getEvenementsParUniversite(Long universiteId) {
        return calendrierRepo.findByUniversiteIdOrderByDateDebutAsc(universiteId);
    }

    public List<CalendrierAcademique> getEvenementsActifsParUniversite(Long universiteId) {
        return calendrierRepo.findByUniversiteIdAndActifTrue(universiteId);
    }

    public List<CalendrierAcademique> getEvenementsParDate(Long universiteId, LocalDate date) {
        return calendrierRepo.findEvenementsActifsParDate(universiteId, date);
    }

    @Transactional
    public CalendrierAcademique creerEvenement(CalendrierAcademique evenement) {
        if (evenement.getDateDebut().isAfter(evenement.getDateFin())) {
            throw new RuntimeException("La date de début doit être antérieure à la date de fin.");
        }
        return calendrierRepo.save(evenement);
    }

    @Transactional
    public CalendrierAcademique modifierEvenement(Long id, CalendrierAcademique evenementModifie) {
        CalendrierAcademique existing = calendrierRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement introuvable"));
        existing.setTitre(evenementModifie.getTitre());
        existing.setDescription(evenementModifie.getDescription());
        existing.setDateDebut(evenementModifie.getDateDebut());
        existing.setDateFin(evenementModifie.getDateFin());
        existing.setType(evenementModifie.getType());
        existing.setCouleur(evenementModifie.getCouleur());
        existing.setActif(evenementModifie.isActif());
        return calendrierRepo.save(existing);
    }

    @Transactional
    public void supprimerEvenement(Long id) {
        calendrierRepo.deleteById(id);
    }

    @Transactional
    public void desactiverEvenement(Long id) {
        CalendrierAcademique evenement = calendrierRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement introuvable"));
        evenement.setActif(false);
        calendrierRepo.save(evenement);
    }
}