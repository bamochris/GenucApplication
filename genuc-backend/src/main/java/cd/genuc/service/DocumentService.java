package cd.genuc.service;

import cd.genuc.model.DocumentEtudiant;
import cd.genuc.model.Etudiant;
import cd.genuc.repository.DocumentEtudiantRepository;
import cd.genuc.repository.EtudiantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentEtudiantRepository docRepo;
    private final EtudiantRepository etudiantRepo;
    private final StockageFichierService stockage;

    public DocumentEtudiant uploadDocument(Long etudiantId, String type, MultipartFile file) throws IOException {
        Etudiant etudiant = etudiantRepo.findById(etudiantId)
            .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

        var enregistre = stockage.enregistrer(file, "documents", StockageFichierService.Categorie.DOCUMENT);

        DocumentEtudiant doc = DocumentEtudiant.builder()
            .etudiant(etudiant)
            .type(DocumentEtudiant.TypeDocument.valueOf(type))
            .nomFichier(enregistre.nomOriginal())
            .url(enregistre.url())
            .valide(false)
            .build();

        return docRepo.save(doc);
    }

    public void archiverEtudiant(Long etudiantId) {
        Etudiant etudiant = etudiantRepo.findById(etudiantId)
            .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));
        etudiant.setArchive(true);
        etudiantRepo.save(etudiant);
    }
}