package cd.genuc.service;

import cd.genuc.model.Conge;
import cd.genuc.model.Conge.StatutConge;
import cd.genuc.model.Personnel;
import cd.genuc.repository.CongeRepository;
import cd.genuc.repository.PersonnelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CongeService {

    private final CongeRepository congeRepo;
    private final PersonnelRepository personnelRepo;

    /**
     * Demander un congé (employé)
     */
    @Transactional
    public Conge demanderConge(Long personnelId, String libelle, LocalDate dateDebut, LocalDate dateFin, String commentaire) {
        Personnel personnel = personnelRepo.findById(personnelId)
                .orElseThrow(() -> new RuntimeException("Personnel introuvable"));

        // Vérifier chevauchement avec un congé déjà validé
        boolean overlapping = congeRepo.existsByPersonnelIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(
                personnelId, dateFin, dateDebut
        );
        if (overlapping) {
            throw new RuntimeException("Vous avez déjà un congé sur cette période");
        }

        Conge conge = Conge.builder()
                .libelle(libelle)
                .dateDebut(dateDebut)
                .dateFin(dateFin)
                .personnel(personnel)
                .demandeurId(personnelId)
                .statut(StatutConge.EN_ATTENTE)
                .commentaire(commentaire)
                .build();

        return congeRepo.save(conge);
    }

    /**
     * Valider un congé (RH)
     */
    @Transactional
    public Conge validerConge(Long congeId, Long valideurId, String commentaire) {
        Conge conge = obtenir(congeId);
        if (conge.getStatut() != StatutConge.EN_ATTENTE) {
            throw new RuntimeException("Ce congé n'est plus en attente");
        }
        conge.setStatut(StatutConge.VALIDE);
        conge.setValideParId(valideurId);
        conge.setDateValidation(LocalDate.now());
        if (commentaire != null) conge.setCommentaire(commentaire);
        return congeRepo.save(conge);
    }

    /**
     * Rejeter un congé (RH)
     */
    @Transactional
    public Conge rejeterConge(Long congeId, String motif) {
        Conge conge = obtenir(congeId);
        if (conge.getStatut() != StatutConge.EN_ATTENTE) {
            throw new RuntimeException("Ce congé n'est plus en attente");
        }
        conge.setStatut(StatutConge.REJETE);
        conge.setMotifRejet(motif);
        return congeRepo.save(conge);
    }

    /**
     * Marquer un congé comme terminé (automatique via scheduler)
     */
    @Transactional
    public void terminerCongesExpires() {
        List<Conge> actifs = congeRepo.findByStatut(StatutConge.VALIDE);
        for (Conge c : actifs) {
            if (c.getDateFin().isBefore(LocalDate.now())) {
                c.setStatut(StatutConge.TERMINE);
                congeRepo.save(c);
            }
        }
    }

    public List<Conge> getCongesPersonnel(Long personnelId) {
        return congeRepo.findByPersonnelId(personnelId);
    }

    public List<Conge> getCongesEnAttente(Long universiteId) {
        return congeRepo.findByStatut(StatutConge.EN_ATTENTE).stream()
                .filter(c -> c.getPersonnel().getUniversite().getId().equals(universiteId))
                .toList();
    }

    public Conge obtenir(Long id) {
        return congeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Congé introuvable"));
    }
}