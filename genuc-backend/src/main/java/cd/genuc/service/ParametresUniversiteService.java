// src/main/java/cd/genuc/service/ParametresUniversiteService.java
package cd.genuc.service;

import cd.genuc.model.ParametresUniversite;
import cd.genuc.config.cache.CacheNames;
import cd.genuc.model.Universite;
import cd.genuc.repository.ParametresUniversiteRepository;
import cd.genuc.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParametresUniversiteService {

    private final ParametresUniversiteRepository parametresRepo;
    private final UniversiteRepository universiteRepo;

    /**
     * Récupère les paramètres d'une université (mis en cache)
     * Le cache est invalidé lorsque les paramètres sont modifiés.
     */
    // @Transactional obligatoire : en l'absence de paramètres, cette méthode CRÉE la ligne
    // par défaut. Sans transaction, ce save() s'exécutait dans sa propre transaction implicite
    // et l'entité revenait détachée — la valeur mise en cache pouvait alors différer de ce qui
    // avait réellement été écrit.
    @Transactional
    @Cacheable(value = CacheNames.PARAMETRES, key = "#universiteId")
    public ParametresUniversite getParametresParUniversite(Long universiteId) {
        log.info("Chargement des paramètres pour l'université {}", universiteId);
        return parametresRepo.findByUniversiteId(universiteId)
                .orElseGet(() -> {
                    // Créer des paramètres par défaut si inexistants
                    Universite uni = universiteRepo.findById(universiteId)
                            .orElseThrow(() -> new RuntimeException("Université introuvable"));
                    ParametresUniversite defaults = ParametresUniversite.builder()
                            .universite(uni)
                            .fraisInscription(50.0)
                            .fraisReleve(5.0)
                            .fraisDiplome(20.0)
                            .fraisParCredit(0.0)
                            .deliberationAutomatique(true)
                            .nbJoursPublication(5)
                            .inscriptionMultiple(false)
                            .delaiValidationDossier(15)
                            .emailNotification(true)
                            .smsNotification(false)
                            .emailMessagerie(uni.getEmail())
                            .nomExpediteurMessagerie(uni.getNom())
                            .build();
                    return parametresRepo.save(defaults);
                });
    }

    /**
     * Met à jour les paramètres et invalide le cache
     */
    @Transactional
    @CacheEvict(value = CacheNames.PARAMETRES, key = "#universiteId")
    public ParametresUniversite updateParametres(Long universiteId, ParametresUniversite updated) {
        log.info("Mise à jour des paramètres pour l'université {}", universiteId);
        ParametresUniversite existing = getParametresParUniversite(universiteId);
        existing.setFraisInscription(updated.getFraisInscription());
        existing.setFraisReleve(updated.getFraisReleve());
        existing.setFraisDiplome(updated.getFraisDiplome());
        existing.setFraisParCredit(updated.getFraisParCredit());
        existing.setDeliberationAutomatique(updated.getDeliberationAutomatique());
        existing.setNbJoursPublication(updated.getNbJoursPublication());
        existing.setInscriptionMultiple(updated.getInscriptionMultiple());
        existing.setDelaiValidationDossier(updated.getDelaiValidationDossier());
        existing.setEmailNotification(updated.getEmailNotification());
        existing.setSmsNotification(updated.getSmsNotification());
        existing.setEmailMessagerie(updated.getEmailMessagerie());
        existing.setNomExpediteurMessagerie(updated.getNomExpediteurMessagerie());
        return parametresRepo.save(existing);
    }

    /**
     * Vide tout le cache "parametres" (utile après une mise à jour en masse)
     */
    @CacheEvict(value = CacheNames.PARAMETRES, allEntries = true)
    public void clearCache() {
        log.info("Cache des paramètres vidé");
    }
}