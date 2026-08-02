package cd.genuc.service;

import cd.genuc.model.Etudiant;
import cd.genuc.config.cache.CacheNames;
import cd.genuc.repository.EtudiantRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class EtudiantService {

    private final EtudiantRepository etudiantRepository;

    public EtudiantService(EtudiantRepository etudiantRepository) {
        this.etudiantRepository = etudiantRepository;
    }

    // =========================
    // INSCRIPTION ETUDIANT
    // =========================
    @Transactional
    public Etudiant inscrireEtudiant(Etudiant etudiant) {
        Optional<Etudiant> existing = etudiantRepository.findByEmail(etudiant.getEmail());
        if (existing.isPresent()) {
            throw new RuntimeException("Cet email est déjà utilisé !");
        }
        return etudiantRepository.save(etudiant);
    }

    @Transactional(readOnly = true)
    public List<Etudiant> getAllEtudiants() {
        return etudiantRepository.findAll();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.PROFIL_UTILISATEUR, key = "'etudiant-' + #id")
    public Etudiant getEtudiantById(Long id) {
        return etudiantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Etudiant introuvable avec id : " + id));
    }

    @Transactional
    @CacheEvict(value = CacheNames.PROFIL_UTILISATEUR, key = "'etudiant-' + #id")
    public Etudiant updateEtudiant(Long id, Etudiant updatedEtudiant) {
        Etudiant etudiant = getEtudiantById(id);
        etudiant.setNom(updatedEtudiant.getNom());
        etudiant.setEmail(updatedEtudiant.getEmail());
        etudiant.setPrenom(updatedEtudiant.getPrenom());
        return etudiantRepository.save(etudiant);
    }

    @Transactional
    @CacheEvict(value = CacheNames.PROFIL_UTILISATEUR, key = "'etudiant-' + #id")
    public void deleteEtudiant(Long id) {
        Etudiant etudiant = getEtudiantById(id);
        etudiantRepository.delete(etudiant);
    }
}