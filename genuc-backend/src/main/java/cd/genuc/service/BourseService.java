package cd.genuc.service;

import cd.genuc.model.BourseOffre;
import cd.genuc.model.CandidatureBourse;
import cd.genuc.model.Etudiant;
import cd.genuc.model.Universite;
import cd.genuc.repository.BourseOffreRepository;
import cd.genuc.repository.CandidatureBourseRepository;
import cd.genuc.repository.EtudiantRepository;
import cd.genuc.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BourseService {

    private final BourseOffreRepository bourseOffreRepository;
    private final CandidatureBourseRepository candidatureBourseRepository;
    private final EtudiantRepository etudiantRepository;
    private final UniversiteRepository universiteRepository;

    private final StockageFichierService stockage;

    // ─── Offres (catalogue) ───────────────────────────────────────

    public List<BourseOffre> listerOffresDisponibles() {
        return bourseOffreRepository.findByActifTrue();
    }

    public List<BourseOffre> listerOffresParUniversite(Long universiteId) {
        return bourseOffreRepository.findByUniversiteIdAndActifTrue(universiteId);
    }

    public List<BourseOffre> listerToutesOffres() {
        return bourseOffreRepository.findAll();
    }

    public BourseOffre obtenirOffre(Long id) {
        return bourseOffreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre de bourse introuvable"));
    }

    @Transactional
    public BourseOffre creerOffre(BourseOffre offre) {
        if (offre.getUniversite() != null && offre.getUniversite().getId() != null) {
            Universite universite = universiteRepository.findById(offre.getUniversite().getId())
                    .orElseThrow(() -> new RuntimeException("Université introuvable"));
            offre.setUniversite(universite);
        }
        if (offre.getPlacesRestantes() == null) {
            offre.setPlacesRestantes(offre.getPlacesDisponibles());
        }
        return bourseOffreRepository.save(offre);
    }

    @Transactional
    public void desactiverOffre(Long id) {
        BourseOffre offre = obtenirOffre(id);
        offre.setActif(false);
        bourseOffreRepository.save(offre);
    }

    // ─── Candidatures ───────────────────────────────────────────

    @Transactional
    public CandidatureBourse postuler(Long bourseId, Long etudiantId, String motivation, MultipartFile pieces) throws IOException {
        BourseOffre offre = obtenirOffre(bourseId);
        if (!offre.isActif()) {
            throw new RuntimeException("Cette offre de bourse n'est plus disponible");
        }
        if (offre.getPlacesRestantes() != null && offre.getPlacesRestantes() <= 0) {
            throw new RuntimeException("Cette offre de bourse ne dispose plus de places disponibles");
        }
        if (candidatureBourseRepository.existsByBourseOffreIdAndEtudiantId(bourseId, etudiantId)) {
            throw new RuntimeException("Vous avez déjà postulé pour cette bourse");
        }
        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

        String pieceUrl = null;
        if (pieces != null && !pieces.isEmpty()) {
            pieceUrl = stockage.enregistrer(pieces, "bourses", StockageFichierService.Categorie.DOCUMENT).url();
        }

        CandidatureBourse candidature = CandidatureBourse.builder()
                .bourseOffre(offre)
                .etudiant(etudiant)
                .motivation(motivation)
                .pieceJustificativeUrl(pieceUrl)
                .statut(CandidatureBourse.StatutCandidature.EN_ATTENTE)
                .build();
        return candidatureBourseRepository.save(candidature);
    }

    public List<CandidatureBourse> getCandidaturesEtudiant(Long etudiantId) {
        return candidatureBourseRepository.findByEtudiantId(etudiantId);
    }

    public List<CandidatureBourse> getCandidaturesParUniversite(Long universiteId) {
        return candidatureBourseRepository.findByUniversiteId(universiteId);
    }

    public List<CandidatureBourse> getToutesCandidatures() {
        return candidatureBourseRepository.findAll();
    }

    private CandidatureBourse obtenirCandidature(Long id) {
        return candidatureBourseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature introuvable"));
    }

    @Transactional
    public CandidatureBourse approuverCandidature(Long id) {
        CandidatureBourse candidature = obtenirCandidature(id);
        if (candidature.getStatut() != CandidatureBourse.StatutCandidature.EN_ATTENTE) {
            throw new RuntimeException("Seule une candidature en attente peut être approuvée");
        }
        BourseOffre offre = candidature.getBourseOffre();
        if (offre.getPlacesRestantes() != null && offre.getPlacesRestantes() <= 0) {
            throw new RuntimeException("Plus de places disponibles pour cette offre");
        }
        if (offre.getPlacesRestantes() != null) {
            offre.setPlacesRestantes(offre.getPlacesRestantes() - 1);
            bourseOffreRepository.save(offre);
        }
        candidature.setStatut(CandidatureBourse.StatutCandidature.APPROUVEE);
        candidature.setDateDecision(LocalDateTime.now());
        candidature.setMotifRejet(null);
        return candidatureBourseRepository.save(candidature);
    }

    @Transactional
    public CandidatureBourse rejeterCandidature(Long id, String motifRejet) {
        CandidatureBourse candidature = obtenirCandidature(id);
        if (candidature.getStatut() != CandidatureBourse.StatutCandidature.EN_ATTENTE) {
            throw new RuntimeException("Seule une candidature en attente peut être rejetée");
        }
        candidature.setStatut(CandidatureBourse.StatutCandidature.REJETEE);
        candidature.setMotifRejet(motifRejet);
        candidature.setDateDecision(LocalDateTime.now());
        return candidatureBourseRepository.save(candidature);
    }
}
