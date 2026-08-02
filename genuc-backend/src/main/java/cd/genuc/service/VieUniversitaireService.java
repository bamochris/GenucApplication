package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VieUniversitaireService {

    private final AssociationRepository associationRepo;
    private final AssociationMembreRepository membreRepo;
    private final EvenementUniversitaireRepository evenementRepo;
    private final EvenementParticipantRepository participantRepo;
    private final UniversiteRepository universiteRepo;
    private final InscriptionRepository inscriptionRepo;

    // ─────────────────────────────────────────────
    // CLUBS / ASSOCIATIONS
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listerClubs(Long universiteId) {
        return associationRepo.findByUniversiteIdAndActifTrueOrderByNomAsc(universiteId)
                .stream().map(this::toClubDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listerClubsEtudiant(Long inscriptionId) {
        return membreRepo.findAssociationsByInscriptionId(inscriptionId)
                .stream().map(this::toClubDto).collect(Collectors.toList());
    }

    @Transactional
    public Association creerClub(Map<String, Object> body) {
        if (body.get("nom") == null || body.get("nom").toString().isBlank()) {
            throw new RuntimeException("Le nom du club est requis");
        }
        if (body.get("universiteId") == null) {
            throw new RuntimeException("universiteId est requis");
        }
        Universite universite = universiteRepo.findById(Long.valueOf(body.get("universiteId").toString()))
                .orElseThrow(() -> new RuntimeException("Université introuvable"));

        Association association = Association.builder()
                .nom(body.get("nom").toString())
                .description(body.get("description") != null ? body.get("description").toString() : null)
                .domaine(body.get("domaine") != null ? body.get("domaine").toString() : "AUTRE")
                .email(body.get("email") != null ? body.get("email").toString() : null)
                .responsable(body.get("responsable") != null ? body.get("responsable").toString() : null)
                .universite(universite)
                .createurUtilisateurId(body.get("createurId") != null ? Long.valueOf(body.get("createurId").toString()) : null)
                .actif(true)
                .build();

        return associationRepo.save(association);
    }

    @Transactional
    public Association modifierClub(Long id, Map<String, Object> body) {
        Association association = associationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Club introuvable"));
        if (body.containsKey("nom")) association.setNom(body.get("nom").toString());
        if (body.containsKey("description")) association.setDescription(body.get("description").toString());
        if (body.containsKey("domaine")) association.setDomaine(body.get("domaine").toString());
        if (body.containsKey("email")) association.setEmail(body.get("email").toString());
        if (body.containsKey("responsable")) association.setResponsable(body.get("responsable").toString());
        return associationRepo.save(association);
    }

    @Transactional
    public void supprimerClub(Long id) {
        Association association = associationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Club introuvable"));
        association.setActif(false);
        associationRepo.save(association);
    }

    @Transactional
    public void rejoindreClub(Long clubId, Long inscriptionId) {
        Association association = associationRepo.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club introuvable"));
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        if (membreRepo.existsByAssociationIdAndInscriptionId(clubId, inscriptionId)) {
            throw new RuntimeException("Vous êtes déjà membre de ce club");
        }

        AssociationMembre membre = AssociationMembre.builder()
                .association(association)
                .inscription(inscription)
                .build();
        membreRepo.save(membre);
    }

    @Transactional
    public void quitterClub(Long clubId, Long inscriptionId) {
        if (!membreRepo.existsByAssociationIdAndInscriptionId(clubId, inscriptionId)) {
            throw new RuntimeException("Vous n'êtes pas membre de ce club");
        }
        membreRepo.deleteByAssociationIdAndInscriptionId(clubId, inscriptionId);
    }

    private Map<String, Object> toClubDto(Association a) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", a.getId());
        dto.put("nom", a.getNom());
        dto.put("description", a.getDescription());
        dto.put("domaine", a.getDomaine());
        dto.put("email", a.getEmail());
        dto.put("responsable", a.getResponsable());
        dto.put("membresCount", membreRepo.countByAssociationId(a.getId()));
        dto.put("creeLe", a.getCreeLe());
        return dto;
    }

    // ─────────────────────────────────────────────
    // ÉVÉNEMENTS
    // ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listerEvenements(Long universiteId) {
        return evenementRepo.findByUniversiteIdOrderByDateAsc(universiteId)
                .stream().map(this::toEvenementDto).collect(Collectors.toList());
    }

    @Transactional
    public EvenementUniversitaire creerEvenement(Map<String, Object> body) {
        if (body.get("titre") == null || body.get("titre").toString().isBlank()) {
            throw new RuntimeException("Le titre de l'événement est requis");
        }
        if (body.get("universiteId") == null) {
            throw new RuntimeException("universiteId est requis");
        }
        if (body.get("date") == null) {
            throw new RuntimeException("La date est requise");
        }
        Universite universite = universiteRepo.findById(Long.valueOf(body.get("universiteId").toString()))
                .orElseThrow(() -> new RuntimeException("Université introuvable"));

        Association association = null;
        if (body.get("associationId") != null) {
            association = associationRepo.findById(Long.valueOf(body.get("associationId").toString())).orElse(null);
        }

        EvenementUniversitaire evenement = EvenementUniversitaire.builder()
                .titre(body.get("titre").toString())
                .description(body.get("description") != null ? body.get("description").toString() : null)
                .date(LocalDate.parse(body.get("date").toString()))
                .heure(body.get("heure") != null ? body.get("heure").toString() : null)
                .lieu(body.get("lieu") != null ? body.get("lieu").toString() : null)
                .association(association)
                .universite(universite)
                .creeParUtilisateurId(body.get("creeParId") != null ? Long.valueOf(body.get("creeParId").toString()) : null)
                .build();

        return evenementRepo.save(evenement);
    }

    @Transactional
    public EvenementUniversitaire modifierEvenement(Long id, Map<String, Object> body) {
        EvenementUniversitaire evenement = evenementRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement introuvable"));
        if (body.containsKey("titre")) evenement.setTitre(body.get("titre").toString());
        if (body.containsKey("description")) evenement.setDescription(body.get("description").toString());
        if (body.containsKey("date")) evenement.setDate(LocalDate.parse(body.get("date").toString()));
        if (body.containsKey("heure")) evenement.setHeure(body.get("heure").toString());
        if (body.containsKey("lieu")) evenement.setLieu(body.get("lieu").toString());
        return evenementRepo.save(evenement);
    }

    @Transactional
    public void supprimerEvenement(Long id) {
        if (!evenementRepo.existsById(id)) {
            throw new RuntimeException("Événement introuvable");
        }
        evenementRepo.deleteById(id);
    }

    @Transactional
    public void inscrireEvenement(Long evenementId, Long inscriptionId) {
        EvenementUniversitaire evenement = evenementRepo.findById(evenementId)
                .orElseThrow(() -> new RuntimeException("Événement introuvable"));
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        if (participantRepo.existsByEvenementIdAndInscriptionId(evenementId, inscriptionId)) {
            throw new RuntimeException("Vous êtes déjà inscrit à cet événement");
        }

        EvenementParticipant participant = EvenementParticipant.builder()
                .evenement(evenement)
                .inscription(inscription)
                .build();
        participantRepo.save(participant);
    }

    private Map<String, Object> toEvenementDto(EvenementUniversitaire e) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", e.getId());
        dto.put("titre", e.getTitre());
        dto.put("description", e.getDescription());
        dto.put("date", e.getDate());
        dto.put("heure", e.getHeure());
        dto.put("lieu", e.getLieu());
        dto.put("club", e.getAssociation() != null ? e.getAssociation().getNom() : null);
        dto.put("participantsCount", participantRepo.countByEvenementId(e.getId()));
        return dto;
    }
}
