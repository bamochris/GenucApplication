package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.DossierSocial.StatutDossierSocial;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ServiceSocialService {

    private final DossierSocialRepository dossierRepo;
    private final BourseRepository bourseRepo;
    private final AideSocialeRepository aideRepo;
    private final EtudiantRepository etudiantRepo;
    private final InscriptionRepository inscriptionRepo;
    private final UtilisateurRepository utilisateurRepo;

    // ─── DOSSIERS SOCIAUX ──────────────────────────────────────

    public List<DossierSocial> getDossiersParUniversite(Long universiteId) {
        return dossierRepo.findByStatutAndInscriptionUniversiteId(null, universiteId);
    }

    public List<DossierSocial> getDossiersParStatut(StatutDossierSocial statut, Long universiteId) {
        if (universiteId != null) {
            return dossierRepo.findByStatutAndInscriptionUniversiteId(statut, universiteId);
        }
        return dossierRepo.findByStatut(statut);
    }

    public DossierSocial getDossier(Long id) {
        return dossierRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Dossier social introuvable"));
    }

    public DossierSocial getDossierByEtudiant(Long etudiantId) {
        return dossierRepo.findByEtudiantId(etudiantId)
                .orElseThrow(() -> new RuntimeException("Dossier social introuvable pour cet étudiant"));
    }

    @Transactional
    public DossierSocial creerDossier(DossierSocial dossier) {
        // Vérifier que l'étudiant existe
        etudiantRepo.findById(dossier.getEtudiant().getId())
                .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

        // Vérifier qu'il n'y a pas déjà un dossier
        if (dossierRepo.existsByEtudiantId(dossier.getEtudiant().getId())) {
            throw new RuntimeException("Un dossier social existe déjà pour cet étudiant");
        }

        return dossierRepo.save(dossier);
    }

    @Transactional
    public DossierSocial modifierDossier(Long id, DossierSocial details) {
        DossierSocial existing = getDossier(id);
        existing.setSituationFamiliale(details.getSituationFamiliale());
        existing.setNombreEnfants(details.getNombreEnfants());
        existing.setNombrePersonnesCharge(details.getNombrePersonnesCharge());
        existing.setProfessionParent(details.getProfessionParent());
        existing.setRevenuMensuelFoyer(details.getRevenuMensuelFoyer());
        existing.setSourceRevenu(details.getSourceRevenu());
        existing.setLogementPropre(details.getLogementPropre());
        existing.setTypeLogement(details.getTypeLogement());
        existing.setHandicap(details.getHandicap());
        existing.setTypeHandicap(details.getTypeHandicap());
        existing.setProblemesSante(details.getProblemesSante());
        existing.setDemandeBourse(details.getDemandeBourse());
        existing.setTypeBourseDemandee(details.getTypeBourseDemandee());
        existing.setMontantDemande(details.getMontantDemande());
        existing.setUrlCertificatScolarite(details.getUrlCertificatScolarite());
        existing.setUrlBulletinNotes(details.getUrlBulletinNotes());
        existing.setUrlAttestationRevenus(details.getUrlAttestationRevenus());
        existing.setUrlCertificatHandicap(details.getUrlCertificatHandicap());
        existing.setUrlLettreMotivation(details.getUrlLettreMotivation());
        return dossierRepo.save(existing);
    }

    @Transactional
    public DossierSocial changerStatut(Long id, DossierSocial.StatutDossierSocial statut, String commentaire, Long adminId) {
        DossierSocial dossier = getDossier(id);
        dossier.setStatut(statut);
        if (commentaire != null) {
            dossier.setCommentaireAdmin(commentaire);
        }

        // Si le dossier est validé et que l'étudiant a demandé une bourse, créer automatiquement la bourse
        if (statut == DossierSocial.StatutDossierSocial.VALIDE && dossier.getDemandeBourse()) {
            creerBourseAutomatique(dossier);
        }

        return dossierRepo.save(dossier);
    }

    // ─── BOURSES ────────────────────────────────────────────────

    public List<Bourse> getBoursesParEtudiant(Long etudiantId) {
        return bourseRepo.findByDossierSocialEtudiantId(etudiantId);
    }

    public List<Bourse> getBoursesParUniversite(Long universiteId) {
        return bourseRepo.findByDossierSocialInscriptionUniversiteIdAndStatut(universiteId, Bourse.StatutBourse.ACTIVE);
    }

    public Bourse getBourse(Long id) {
        return bourseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Bourse introuvable"));
    }

    @Transactional
    public Bourse creerBourse(Bourse bourse) {
        bourse.setNumeroBourse(null); // Sera généré par @PrePersist
        return bourseRepo.save(bourse);
    }

    @Transactional
    public void creerBourseAutomatique(DossierSocial dossier) {
        Bourse bourse = Bourse.builder()
                .dossierSocial(dossier)
                .type(Bourse.TypeBourse.valueOf(dossier.getTypeBourseDemandee()))
                .montantTotal(dossier.getMontantDemande())
                .dureeMois(10) // Année académique
                .statut(Bourse.StatutBourse.ACTIVE)
                .dateDebut(LocalDate.now())
                .typePaiement("MENSUEL")
                .conditions("Bourse attribuée suite à la validation du dossier social")
                .build();

        bourse.setMontantParMois(bourse.getMontantTotal() / bourse.getDureeMois());
        bourseRepo.save(bourse);
    }

    @Transactional
    public Bourse suspendreBourse(Long id) {
        Bourse bourse = getBourse(id);
        bourse.setStatut(Bourse.StatutBourse.SUSPENDUE);
        return bourseRepo.save(bourse);
    }

    @Transactional
    public Bourse terminerBourse(Long id) {
        Bourse bourse = getBourse(id);
        bourse.setStatut(Bourse.StatutBourse.TERMINEE);
        bourse.setDateFin(LocalDate.now());
        return bourseRepo.save(bourse);
    }

    // ─── AIDES SOCIALES ─────────────────────────────────────────

    public List<AideSociale> getAidesParEtudiant(Long etudiantId) {
        return aideRepo.findByEtudiantId(etudiantId);
    }

    public List<AideSociale> getAidesParUniversite(Long universiteId) {
        return aideRepo.findByDossierSocialInscriptionUniversiteId(universiteId);
    }

    public List<AideSociale> getAidesParStatut(AideSociale.StatutAide statut, Long universiteId) {
        if (universiteId != null) {
            return aideRepo.findByDossierSocialInscriptionUniversiteIdAndStatut(universiteId, statut);
        }
        return aideRepo.findByStatut(statut);
    }

    public AideSociale getAide(Long id) {
        return aideRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Aide sociale introuvable"));
    }

    @Transactional
    public AideSociale creerAide(AideSociale aide) {
        return aideRepo.save(aide);
    }

    @Transactional
    public AideSociale traiterAide(Long id, AideSociale.StatutAide statut, String commentaire, Long traiteParId) {
        AideSociale aide = getAide(id);
        aide.setStatut(statut);
        aide.setCommentaire(commentaire);
        aide.setDateTraitement(LocalDate.now());
        if (traiteParId != null) {
            Utilisateur traitePar = utilisateurRepo.findById(traiteParId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
            aide.setTraitePar(traitePar);
        }
        return aideRepo.save(aide);
    }

    // ─── STATISTIQUES ───────────────────────────────────────────

    public Map<String, Object> getStatistiques(Long universiteId) {
        long totalDossiers = dossierRepo.findByStatutAndInscriptionUniversiteId(null, universiteId).size();
        long enAttente = dossierRepo.findByStatutAndInscriptionUniversiteId(DossierSocial.StatutDossierSocial.EN_ATTENTE, universiteId).size();
        long valides = dossierRepo.findByStatutAndInscriptionUniversiteId(DossierSocial.StatutDossierSocial.VALIDE, universiteId).size();
        long rejetes = dossierRepo.findByStatutAndInscriptionUniversiteId(DossierSocial.StatutDossierSocial.REJETE, universiteId).size();

        long boursesActives = bourseRepo.countByDossierSocialInscriptionUniversiteIdAndStatut(universiteId, Bourse.StatutBourse.ACTIVE);
        Double montantTotalBourses = bourseRepo.sumMontantTotalActifByUniversite(universiteId);
        if (montantTotalBourses == null) montantTotalBourses = 0.0;

        long aidesEnAttente = aideRepo.countByDossierSocialInscriptionUniversiteIdAndStatut(universiteId, AideSociale.StatutAide.EN_ATTENTE);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalDossiers", totalDossiers);
        stats.put("enAttente", enAttente);
        stats.put("valides", valides);
        stats.put("rejetes", rejetes);
        stats.put("boursesActives", boursesActives);
        stats.put("montantTotalBourses", montantTotalBourses);
        stats.put("aidesEnAttente", aidesEnAttente);

        return stats;
    }
}