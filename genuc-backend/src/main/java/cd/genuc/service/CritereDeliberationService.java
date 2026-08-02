package cd.genuc.service;

import cd.genuc.model.CritereDeliberation;
import cd.genuc.repository.CritereDeliberationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CritereDeliberationService {

    private final CritereDeliberationRepository critereRepo;

    public Optional<CritereDeliberation> getCritereParPromotionEtAnnee(Long promotionId, Long anneeId) {
        return critereRepo.findByPromotionIdAndAnneeAcademiqueIdAndActifTrue(promotionId, anneeId);
    }

    @Transactional
    public CritereDeliberation creerOuModifier(CritereDeliberation critere) {
        // Vérifier si un critère existe déjà pour cette promo/année
        Optional<CritereDeliberation> existing = critereRepo.findByPromotionIdAndAnneeAcademiqueId(
                critere.getPromotion().getId(),
                critere.getAnneeAcademique().getId()
        );
        if (existing.isPresent()) {
            CritereDeliberation old = existing.get();
            old.setSeuilMoyenne(critere.getSeuilMoyenne());
            old.setSeuilCredits(critere.getSeuilCredits());
            old.setSeuilRattrapage(critere.getSeuilRattrapage());
            old.setPonderationTP(critere.getPonderationTP());
            old.setPonderationInterro(critere.getPonderationInterro());
            old.setPonderationExamen(critere.getPonderationExamen());
            old.setActif(critere.isActif());
            return critereRepo.save(old);
        }
        return critereRepo.save(critere);
    }
}