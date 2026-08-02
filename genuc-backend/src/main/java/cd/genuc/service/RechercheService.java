package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Gère les activités de recherche des professeurs : publications, projets de
 * recherche, conférences/séminaires et laboratoires.
 */
@Service
@RequiredArgsConstructor
public class RechercheService {

    private final PublicationRepository publicationRepo;
    private final ProjetRechercheRepository projetRepo;
    private final ConferenceRepository conferenceRepo;
    private final LaboratoireRepository laboratoireRepo;
    private final UtilisateurRepository utilisateurRepo;

    // ══════════════════════════════════════════
    // Publications
    // ══════════════════════════════════════════

    public List<Publication> getPublications(Long professeurId) {
        return publicationRepo.findByProfesseurIdOrderByAnneeDescCreeLeDesc(professeurId);
    }

    @Transactional
    public Publication creerPublication(Map<String, Object> body) {
        Utilisateur professeur = getProfesseur(body);
        Publication publication = Publication.builder()
                .titre(asString(body, "titre"))
                .auteurs(asString(body, "auteurs"))
                .revue(asString(body, "revue"))
                .annee(asInteger(body, "annee"))
                .doi(asString(body, "doi"))
                .resume(asString(body, "resume"))
                .type(body.containsKey("type") && body.get("type") != null
                        ? Publication.TypePublication.valueOf(body.get("type").toString())
                        : Publication.TypePublication.ARTICLE)
                .professeur(professeur)
                .professeurNom(resolveProfesseurNom(body, professeur))
                .build();
        return publicationRepo.save(publication);
    }

    @Transactional
    public void supprimerPublication(Long id, Long professeurId) {
        Publication publication = publicationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Publication introuvable"));
        verifierProprietaire(publication.getProfesseurId(), professeurId);
        publicationRepo.delete(publication);
    }

    // ══════════════════════════════════════════
    // Projets de recherche
    // ══════════════════════════════════════════

    public List<ProjetRecherche> getProjets(Long professeurId) {
        return projetRepo.findByProfesseurIdOrderByCreeLeDesc(professeurId);
    }

    @Transactional
    public ProjetRecherche creerProjet(Map<String, Object> body) {
        Utilisateur professeur = getProfesseur(body);
        ProjetRecherche projet = ProjetRecherche.builder()
                .titre(asString(body, "titre"))
                .description(asString(body, "description"))
                .financement(asString(body, "financement"))
                .montant(asDouble(body, "montant"))
                .dateDebut(asDate(body, "dateDebut"))
                .dateFin(asDate(body, "dateFin"))
                .statut(body.containsKey("statut") && body.get("statut") != null
                        ? ProjetRecherche.StatutProjet.valueOf(body.get("statut").toString())
                        : ProjetRecherche.StatutProjet.EN_COURS)
                .professeur(professeur)
                .professeurNom(resolveProfesseurNom(body, professeur))
                .build();
        return projetRepo.save(projet);
    }

    @Transactional
    public void supprimerProjet(Long id, Long professeurId) {
        ProjetRecherche projet = projetRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Projet de recherche introuvable"));
        verifierProprietaire(projet.getProfesseurId(), professeurId);
        projetRepo.delete(projet);
    }

    // ══════════════════════════════════════════
    // Conférences / séminaires
    // ══════════════════════════════════════════

    public List<Conference> getConferences(Long professeurId) {
        return conferenceRepo.findByProfesseurIdOrderByDateDescCreeLeDesc(professeurId);
    }

    @Transactional
    public Conference creerConference(Map<String, Object> body) {
        Utilisateur professeur = getProfesseur(body);
        Conference conference = Conference.builder()
                .titre(asString(body, "titre"))
                .description(asString(body, "description"))
                .type(body.containsKey("type") && body.get("type") != null
                        ? Conference.TypeConference.valueOf(body.get("type").toString())
                        : Conference.TypeConference.CONFERENCE)
                .date(asDate(body, "date"))
                .lieu(asString(body, "lieu"))
                .organisateur(asString(body, "organisateur"))
                .lien(asString(body, "lien"))
                .professeur(professeur)
                .professeurNom(resolveProfesseurNom(body, professeur))
                .build();
        return conferenceRepo.save(conference);
    }

    @Transactional
    public void supprimerConference(Long id, Long professeurId) {
        Conference conference = conferenceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Conférence introuvable"));
        verifierProprietaire(conference.getProfesseurId(), professeurId);
        conferenceRepo.delete(conference);
    }

    // ══════════════════════════════════════════
    // Laboratoires
    // ══════════════════════════════════════════

    public List<Laboratoire> getLaboratoires(Long professeurId) {
        return laboratoireRepo.findByProfesseurIdOrderByCreeLeDesc(professeurId);
    }

    @Transactional
    public Laboratoire creerLaboratoire(Map<String, Object> body) {
        Utilisateur professeur = getProfesseur(body);
        Laboratoire laboratoire = Laboratoire.builder()
                .nom(asString(body, "nom"))
                .description(asString(body, "description"))
                .domaine(asString(body, "domaine"))
                .responsable(asString(body, "responsable"))
                .email(asString(body, "email"))
                .telephone(asString(body, "telephone"))
                .capacite(asInteger(body, "capacite"))
                .equipements(asString(body, "equipements"))
                .statut(body.containsKey("statut") && body.get("statut") != null
                        ? Laboratoire.StatutLaboratoire.valueOf(body.get("statut").toString())
                        : Laboratoire.StatutLaboratoire.ACTIF)
                .professeur(professeur)
                .professeurNom(resolveProfesseurNom(body, professeur))
                .build();
        return laboratoireRepo.save(laboratoire);
    }

    @Transactional
    public void supprimerLaboratoire(Long id, Long professeurId) {
        Laboratoire laboratoire = laboratoireRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Laboratoire introuvable"));
        verifierProprietaire(laboratoire.getProfesseurId(), professeurId);
        laboratoireRepo.delete(laboratoire);
    }

    // ══════════════════════════════════════════
    // Utilitaires communs
    // ══════════════════════════════════════════

    private Utilisateur getProfesseur(Map<String, Object> body) {
        if (!body.containsKey("professeurId") || body.get("professeurId") == null) {
            throw new RuntimeException("professeurId est requis");
        }
        Long professeurId = Long.valueOf(body.get("professeurId").toString());
        return utilisateurRepo.findById(professeurId)
                .orElseThrow(() -> new RuntimeException("Professeur introuvable"));
    }

    private String resolveProfesseurNom(Map<String, Object> body, Utilisateur professeur) {
        Object nom = body.get("professeurNom");
        if (nom != null && !nom.toString().isBlank()) {
            return nom.toString();
        }
        return professeur.getNomComplet();
    }

    private void verifierProprietaire(Long ownerId, Long professeurId) {
        if (professeurId == null || !professeurId.equals(ownerId)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier cet enregistrement");
        }
    }

    private String asString(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : value.toString();
    }

    private Integer asInteger(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || value.toString().isBlank()) return null;
        try {
            return Integer.valueOf(value.toString());
        } catch (NumberFormatException e) {
            throw new RuntimeException(key + " doit être un nombre entier");
        }
    }

    private Double asDouble(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || value.toString().isBlank()) return null;
        try {
            return Double.valueOf(value.toString());
        } catch (NumberFormatException e) {
            throw new RuntimeException(key + " doit être un nombre");
        }
    }

    private LocalDate asDate(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || value.toString().isBlank()) return null;
        return LocalDate.parse(value.toString());
    }
}
