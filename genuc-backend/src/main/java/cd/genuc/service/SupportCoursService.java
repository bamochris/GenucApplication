package cd.genuc.service;

import cd.genuc.model.Cours;
import cd.genuc.model.SupportCours;
import cd.genuc.repository.CoursRepository;
import cd.genuc.repository.SupportCoursRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Gestion des supports de cours (fichiers déposés par les professeurs :
 * PDF, vidéos, documents, présentations). Le stockage physique est délégué
 * à {@link S3Service}, comme pour les autres documents de la plateforme.
 */
@Service
@RequiredArgsConstructor
public class SupportCoursService {

    private final SupportCoursRepository supportRepo;
    private final CoursRepository coursRepo;
    private final S3Service s3Service;

    @Transactional(readOnly = true)
    public List<SupportCours> lister(Long coursId) {
        return supportRepo.findByCoursIdOrderByCreeLeDesc(coursId);
    }

    @Transactional
    public SupportCours ajouter(Long coursId, String titre, String description, String type,
                                 MultipartFile fichier, Long professeurId) throws IOException {
        Cours cours = coursRepo.findById(coursId)
                .orElseThrow(() -> new RuntimeException("Cours introuvable : id=" + coursId));

        if (fichier == null || fichier.isEmpty()) {
            throw new RuntimeException("Aucun fichier fourni");
        }

        String nomOriginal = fichier.getOriginalFilename();
        String key = S3Service.cleSupportCours(coursId, nomOriginal);
        String url = s3Service.uploadFile(fichier.getBytes(), key, fichier.getContentType(),
                nomOriginal != null ? nomOriginal : "support");

        SupportCours support = SupportCours.builder()
                .titre(titre)
                .description(description)
                .type(SupportCours.TypeSupport.valueOf(type))
                .s3Key(key)
                .url(url)
                .nomFichierOriginal(nomOriginal)
                .tailleOctets(fichier.getSize())
                .professeurId(professeurId)
                .cours(cours)
                .build();

        return supportRepo.save(support);
    }

    @Transactional
    public void supprimer(Long id, Long professeurId, boolean estAdmin) {
        SupportCours support = supportRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Support introuvable : id=" + id));

        if (!estAdmin && !support.getProfesseurId().equals(professeurId)) {
            throw new RuntimeException("Vous ne pouvez supprimer que vos propres supports de cours");
        }

        s3Service.supprimerDocument(support.getS3Key());
        supportRepo.delete(support);
    }
}
