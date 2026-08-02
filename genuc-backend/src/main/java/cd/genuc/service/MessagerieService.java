// cd.genuc.service.MessagerieService.java
package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessagerieService {

    private final MessageRepository messageRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final InscriptionRepository inscriptionRepo;
    private final DepartementRepository departementRepo;
    private final ServiceUniversiteRepository serviceUniversiteRepo;

    // ═══════════════════════════════════════════════════════════════
    // ENVOYER UN MESSAGE
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public Message envoyerMessage(Map<String, Object> data) {
        return envoyerMessages(data).get(0);
    }

    @Transactional
    public List<Message> envoyerMessages(Map<String, Object> data) {
        Long expediteurId = Long.valueOf(data.get("expediteurId").toString());
        String expediteurRole = (String) data.get("expediteurRole");
        Long inscriptionId = data.get("inscriptionId") != null
            ? Long.valueOf(data.get("inscriptionId").toString()) : null;
        String sujet = (String) data.get("sujet");
        String contenu = (String) data.get("contenu");

        Utilisateur expediteur = utilisateurRepo.findById(expediteurId)
            .orElseThrow(() -> new RuntimeException("Expéditeur non trouvé"));

        Long universiteId = data.get("universiteId") != null
                ? Long.valueOf(data.get("universiteId").toString())
                : expediteur.getUniversiteId();

        if (inscriptionId != null) {
            Inscription inscription = inscriptionRepo.findById(inscriptionId).orElse(null);
            if (inscription != null && inscription.getUniversite() != null) {
                universiteId = inscription.getUniversite().getId();
            }
        }

        List<Message> messages = new ArrayList<>();

        List<Long> inscriptionIds = parseLongList(data.get("inscriptionIds"));
        if (!inscriptionIds.isEmpty()) {
            for (Long currentInscriptionId : inscriptionIds) {
                Inscription inscription = inscriptionRepo.findById(currentInscriptionId)
                        .orElseThrow(() -> new RuntimeException("Inscription introuvable: " + currentInscriptionId));
                messages.add(buildMessageForInscription(expediteur, expediteurRole, sujet, contenu, inscription));
            }
            return messageRepo.saveAll(messages);
        }

        List<Long> destinataireIds = parseLongList(data.get("destinataireIds"));
        if (!destinataireIds.isEmpty()) {
            for (Long destinataireId : destinataireIds) {
                Utilisateur destinataire = utilisateurRepo.findById(destinataireId)
                        .orElseThrow(() -> new RuntimeException("Destinataire introuvable: " + destinataireId));
                messages.add(buildMessageForUtilisateur(expediteur, expediteurRole, sujet, contenu, destinataire));
            }
            return messageRepo.saveAll(messages);
        }

        String cibleType = data.get("cibleType") != null ? data.get("cibleType").toString() : null;
        if (cibleType != null && !cibleType.isBlank()) {
            switch (cibleType) {
                case "TOUS_ETUDIANTS":
                    for (Inscription inscription : inscriptionRepo.findByUniversiteId(universiteId)) {
                        messages.add(buildMessageForInscription(expediteur, expediteurRole, sujet, contenu, inscription));
                    }
                    break;
                case "PROMOTION":
                    if (data.get("promotionId") == null) {
                        throw new RuntimeException("promotionId est requis pour cibler une promotion");
                    }
                    Long promotionId = Long.valueOf(data.get("promotionId").toString());
                    for (Inscription inscription : inscriptionRepo.findByPromotionId(promotionId)) {
                        messages.add(buildMessageForInscription(expediteur, expediteurRole, sujet, contenu, inscription));
                    }
                    break;
                case "PROFESSEURS":
                    for (Utilisateur professeur : utilisateurRepo.findByUniversiteIdAndRole(universiteId, RoleEnum.PROFESSEUR)) {
                        messages.add(buildMessageForUtilisateur(expediteur, expediteurRole, sujet, contenu, professeur));
                    }
                    break;
                default:
                    throw new RuntimeException("Type de cible non supporté: " + cibleType);
            }

            if (messages.isEmpty()) {
                throw new RuntimeException("Aucun destinataire trouvé pour cette cible");
            }

            return messageRepo.saveAll(messages);
        }

        String destinataireType = data.get("destinataireId") != null
                ? data.get("destinataireId").toString()
                : (String) data.get("destinataire");

        if (destinataireType == null || destinataireType.isBlank()) {
            throw new RuntimeException("Destinataire introuvable");
        }

        Long destinataireId = null;
        String destinataireNom = null;

        switch (destinataireType) {
            case "scolarite":
                destinataireNom = "Service de Scolarité";
                break;
            case "departement":
                destinataireNom = "Chef de Département";
                break;
            case "caisse":
                destinataireNom = "Service de Caisse";
                break;
            case "direction":
                destinataireNom = "Direction de l'Université";
                break;
            default:
                // Si c'est un ID numérique, chercher l'utilisateur
                try {
                    destinataireId = Long.valueOf(destinataireType);
                    Utilisateur dest = utilisateurRepo.findById(destinataireId).orElse(null);
                    if (dest != null) {
                        destinataireNom = dest.getNomComplet();
                    }
                } catch (NumberFormatException e) {
                    destinataireNom = destinataireType;
                }
                break;
        }

        Message message = Message.builder()
            .sujet(sujet)
            .contenu(contenu)
            .expediteurId(expediteurId)
            .expediteurNom(expediteur.getNomComplet())
            .expediteurRole(expediteurRole)
            .destinataireId(destinataireId)
            .destinataireNom(destinataireNom)
            .destinataireType(destinataireType)
            .inscriptionId(inscriptionId)
            .universiteId(universiteId)
            .lu(false)
            .build();

        return List.of(messageRepo.save(message));
    }

    // ═══════════════════════════════════════════════════════════════
    // LIRE LES MESSAGES D'UN ÉTUDIANT
    // ═══════════════════════════════════════════════════════════════

    public List<Map<String, Object>> getMessagesEtudiant(Long inscriptionId) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
            .orElseThrow(() -> new RuntimeException("Inscription non trouvée"));
        
        List<Message> messages = messageRepo.findByInscriptionIdOrderByDateEnvoiDesc(inscriptionId);
        
        return messages.stream().map(msg -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", msg.getId());
            map.put("sujet", msg.getSujet());
            map.put("contenu", msg.getContenu());
            map.put("expediteurId", msg.getExpediteurId());
            map.put("expediteurNom", msg.getExpediteurNom());
            map.put("destinataireId", msg.getDestinataireId());
            map.put("destinataireNom", msg.getDestinataireNom());
            map.put("destinataireType", msg.getDestinataireType());
            map.put("lu", msg.isLu());
            map.put("dateEnvoi", msg.getDateEnvoi().toString());
            map.put("reponse", msg.getReponse());
            return map;
        }).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════
    // LIRE LES MESSAGES D'UN ADMIN / PROFESSEUR
    // ═══════════════════════════════════════════════════════════════

    public List<Map<String, Object>> getMessagesAdmin(Long utilisateurId) {
        List<Message> messages = messageRepo.findByDestinataireIdOrderByDateEnvoiDesc(utilisateurId);
        
        return messages.stream().map(msg -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", msg.getId());
            map.put("sujet", msg.getSujet());
            map.put("contenu", msg.getContenu());
            map.put("expediteurId", msg.getExpediteurId());
            map.put("expediteurNom", msg.getExpediteurNom());
            map.put("destinataireId", msg.getDestinataireId());
            map.put("destinataireNom", msg.getDestinataireNom());
            map.put("destinataireType", msg.getDestinataireType());
            map.put("lu", msg.isLu());
            map.put("dateEnvoi", msg.getDateEnvoi().toString());
            map.put("inscriptionId", msg.getInscriptionId());
            map.put("reponse", msg.getReponse());
            return map;
        }).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════
    // MARQUER UN MESSAGE COMME LU
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public Message marquerLu(Long messageId) {
        Message message = messageRepo.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message non trouvé"));
        
        if (!message.isLu()) {
            message.setLu(true);
            message.setDateLecture(LocalDateTime.now());
        }
        return messageRepo.save(message);
    }

    // ═══════════════════════════════════════════════════════════════
    // RÉPONDRE À UN MESSAGE (ADMIN)
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public Message repondreMessage(Long messageId, String reponse, Long reponseParId, String reponseParNom) {
        Message message = messageRepo.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message non trouvé"));
        
        message.setReponse(reponse);
        message.setReponseParId(reponseParId);
        message.setReponseParNom(reponseParNom);
        message.setDateReponse(LocalDateTime.now());
        
        return messageRepo.save(message);
    }

    // ═══════════════════════════════════════════════════════════════
    // RÉCUPÉRER LES CONTACTS DISPONIBLES POUR UNE UNIVERSITÉ
    // ═══════════════════════════════════════════════════════════════

    public List<Map<String, Object>> getContactsUniversite(Long universiteId) {
        List<Map<String, Object>> contacts = new ArrayList<>();
        
        // Contacts par défaut
        contacts.add(Map.of(
            "id", "scolarite",
            "nom", "📋 Service de Scolarité",
            "type", "SCOLARITE"
        ));
        
        contacts.add(Map.of(
            "id", "departement",
            "nom", "🏛️ Chef de Département",
            "type", "DEPARTEMENT"
        ));
        
        contacts.add(Map.of(
            "id", "caisse",
            "nom", "💰 Service de Caisse",
            "type", "CAISSE"
        ));
        
        contacts.add(Map.of(
            "id", "direction",
            "nom", "🎓 Direction de l'Université",
            "type", "DIRECTION"
        ));
        
        // Récupérer les services spécifiques de l'université
        List<ServiceUniversite> services = serviceUniversiteRepo.findByUniversiteIdAndActifTrue(universiteId);
        for (ServiceUniversite service : services) {
            contacts.add(Map.of(
                "id", service.getId().toString(),
                "nom", service.getNom(),
                "type", service.getType().name(),
                "responsable", service.getResponsableNom()
            ));
        }
        
        // Récupérer les enseignants (chefs de département)
        List<Utilisateur> enseignants = utilisateurRepo.findByUniversiteIdAndRole(universiteId, RoleEnum.PROFESSEUR);
        for (Utilisateur ens : enseignants) {
            contacts.add(Map.of(
                "id", ens.getId().toString(),
                "nom", "👨‍🏫 " + ens.getNomComplet() + " (Professeur)",
                "type", "PROFESSEUR"
            ));
        }
        
        return contacts;
    }

        public Map<String, Object> getCiblesMessagerieAdmin(Long universiteId) {
        List<Map<String, Object>> etudiants = inscriptionRepo.findByUniversiteId(universiteId).stream()
            .map(inscription -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("inscriptionId", inscription.getId());
                item.put("destinataireId", resolveEtudiantUserId(inscription));
                item.put("nom", inscription.getNomComplet());
                item.put("matricule", inscription.getMatricule());
                item.put("promotionId", inscription.getPromotion() != null ? inscription.getPromotion().getId() : null);
                item.put("promotion", inscription.getPromotion() != null ? inscription.getPromotion().getLibelle() : null);
                return item;
            })
            .collect(Collectors.toList());

        List<Map<String, Object>> promotions = inscriptionRepo.findByUniversiteId(universiteId).stream()
            .filter(inscription -> inscription.getPromotion() != null)
            .collect(Collectors.toMap(
                inscription -> inscription.getPromotion().getId(),
                inscription -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", inscription.getPromotion().getId());
                    item.put("libelle", inscription.getPromotion().getLibelle());
                    return item;
                },
                (left, right) -> left,
                LinkedHashMap::new
            ))
            .values()
            .stream()
            .collect(Collectors.toList());

        List<Map<String, Object>> professeurs = utilisateurRepo.findByUniversiteIdAndRole(universiteId, RoleEnum.PROFESSEUR).stream()
            .map(professeur -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", professeur.getId());
                item.put("nom", professeur.getNomComplet());
                item.put("role", professeur.getRole().name());
                return item;
            })
            .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("etudiants", etudiants);
        result.put("promotions", promotions);
        result.put("professeurs", professeurs);
        return result;
        }

    // ═══════════════════════════════════════════════════════════════
    // COMPTER LES MESSAGES NON LUS
    // ═══════════════════════════════════════════════════════════════

    public long countNonLus(Long destinataireId) {
        return messageRepo.countNonLus(destinataireId);
    }

    @Transactional
    public Message notifierEtudiantDocument(Inscription inscription,
                                            String sujet,
                                            String contenu,
                                            String expediteurNom,
                                            String expediteurRole) {
        if (inscription == null) {
            throw new RuntimeException("Inscription requise pour notifier l'étudiant.");
        }

        Long destinataireId = utilisateurRepo.findByEmail(inscription.getEmail())
                .map(Utilisateur::getId)
                .orElseGet(() -> utilisateurRepo.findByEmail(inscription.getEtudiant().getEmail())
                        .map(Utilisateur::getId)
                        .orElse(null));

        Message message = Message.builder()
                .sujet(sujet)
                .contenu(contenu)
                .expediteurNom(expediteurNom)
                .expediteurRole(expediteurRole)
                .destinataireId(destinataireId)
                .destinataireNom(inscription.getNomComplet())
                .destinataireType("ETUDIANT")
                .inscriptionId(inscription.getId())
                .universiteId(inscription.getUniversite() != null ? inscription.getUniversite().getId() : null)
                .lu(false)
                .build();

        return messageRepo.save(message);
    }

    private Message buildMessageForInscription(Utilisateur expediteur,
                                               String expediteurRole,
                                               String sujet,
                                               String contenu,
                                               Inscription inscription) {
        return Message.builder()
                .sujet(sujet)
                .contenu(contenu)
                .expediteurId(expediteur.getId())
                .expediteurNom(expediteur.getNomComplet())
                .expediteurRole(expediteurRole)
                .destinataireId(resolveEtudiantUserId(inscription))
                .destinataireNom(inscription.getNomComplet())
                .destinataireType("ETUDIANT")
                .inscriptionId(inscription.getId())
                .universiteId(inscription.getUniversite() != null ? inscription.getUniversite().getId() : expediteur.getUniversiteId())
                .lu(false)
                .build();
    }

    private Message buildMessageForUtilisateur(Utilisateur expediteur,
                                               String expediteurRole,
                                               String sujet,
                                               String contenu,
                                               Utilisateur destinataire) {
        return Message.builder()
                .sujet(sujet)
                .contenu(contenu)
                .expediteurId(expediteur.getId())
                .expediteurNom(expediteur.getNomComplet())
                .expediteurRole(expediteurRole)
                .destinataireId(destinataire.getId())
                .destinataireNom(destinataire.getNomComplet())
                .destinataireType(destinataire.getRole() != null ? destinataire.getRole().name() : "UTILISATEUR")
                .universiteId(destinataire.getUniversiteId() != null ? destinataire.getUniversiteId() : expediteur.getUniversiteId())
                .lu(false)
                .build();
    }

    private Long resolveEtudiantUserId(Inscription inscription) {
        if (inscription == null) {
            return null;
        }

        Long destinataireId = utilisateurRepo.findByEmail(inscription.getEmail())
                .map(Utilisateur::getId)
                .orElse(null);

        if (destinataireId == null && inscription.getEtudiant() != null && inscription.getEtudiant().getEmail() != null) {
            destinataireId = utilisateurRepo.findByEmail(inscription.getEtudiant().getEmail())
                    .map(Utilisateur::getId)
                    .orElse(null);
        }

        return destinataireId;
    }

    private List<Long> parseLongList(Object raw) {
        if (raw == null) {
            return Collections.emptyList();
        }

        if (raw instanceof Collection<?> collection) {
            return collection.stream()
                    .filter(Objects::nonNull)
                    .map(Object::toString)
                    .filter(value -> !value.isBlank())
                    .map(Long::valueOf)
                    .distinct()
                    .collect(Collectors.toList());
        }

        String value = raw.toString();
        if (value.isBlank()) {
            return Collections.emptyList();
        }

        return List.of(Long.valueOf(value));
    }
}