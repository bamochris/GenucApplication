package cd.genuc.service;

import cd.genuc.config.cache.CacheNames;
import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HoraireService {

    private final HoraireRepository horaireRepo;
    private final SalleRepository salleRepo;
    private final CoursRepository coursRepo;

    @Transactional
    @CacheEvict(value = CacheNames.HORAIRES, allEntries = true)
    public Horaire creerHoraire(Horaire horaire) {
        // Vérifier conflit de salle
        List<Horaire> conflits = horaireRepo.findConflitsSalle(
            horaire.getSalle().getId(),
            horaire.getJour(),
            horaire.getHeureDebut(),
            horaire.getHeureFin()
        );
        if (!conflits.isEmpty()) {
            throw new RuntimeException("Conflit d'emploi du temps : la salle est déjà occupée à cette plage horaire.");
        }
        // Vérifier que le cours existe
        Cours cours = coursRepo.findById(horaire.getCours().getId())
            .orElseThrow(() -> new RuntimeException("Cours introuvable"));
        horaire.setUniversiteId(cours.getUniversite().getId());
        return horaireRepo.save(horaire);
    }

    /**
     * Emploi du temps d'une promotion, <b>dans une université donnée</b>.
     *
     * <p>Le libellé de promotion (« L1 », « G2 », « Master 1 »…) n'a rien d'unique : les mêmes
     * valeurs existent dans tous les établissements. La requête comme la clé de cache ne
     * portaient auparavant que ce libellé — n'importe quel compte authentifié lisait donc
     * l'emploi du temps de la promotion homonyme de <i>toutes</i> les universités, et la
     * première réponse mise en cache était resservie aux suivantes, quel que soit
     * l'établissement du demandeur. Le filtre et la clé sont désormais cloisonnés par
     * {@code universiteId}.</p>
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.HORAIRES, key = "#universiteId + ':promotion:' + #promotionLibelle")
    public List<Horaire> getHorairesParPromotion(Long universiteId, String promotionLibelle) {
        return horaireRepo.findByUniversiteIdAndPromotionLibelle(universiteId, promotionLibelle);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.HORAIRES, key = "#universiteId + ':salle:' + #salleId")
    public List<Horaire> getHorairesParSalle(Long universiteId, Long salleId) {
        return horaireRepo.findByUniversiteIdAndSalleId(universiteId, salleId);
    }

    @Transactional
    @CacheEvict(value = CacheNames.HORAIRES, allEntries = true)
    public void supprimerHoraire(Long id) {
        horaireRepo.deleteById(id);
    }

    @Transactional
    @CacheEvict(value = CacheNames.HORAIRES, allEntries = true)
    public Horaire creerHoraireAvecEviction(Horaire horaire) {
        return creerHoraire(horaire);
    }
}
