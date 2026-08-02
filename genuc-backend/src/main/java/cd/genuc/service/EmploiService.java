package cd.genuc.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmploiService {

    public Map<String, Object> getOffres(Long etudiantId, String secteur, String type, int page, int size) {
        /* En production : requête DB avec matching IA sur le profil étudiant */
        return Map.of(
            "offres", new ArrayList<>(),
            "total", 0,
            "page", page,
            "size", size
        );
    }

    public Map<String, Object> postuler(Long offreId, Long etudiantId) {
        return Map.of(
            "offreId", offreId,
            "etudiantId", etudiantId,
            "statut", "EN_ATTENTE",
            "dateCandidature", LocalDate.now().toString()
        );
    }

    public List<Map<String, Object>> getAnnuaire(Long universiteId, int limit) {
        return new ArrayList<>();
    }

    public Map<String, Object> getProfilAlumni(Long userId) {
        Map<String, Object> profil = new HashMap<>();
        profil.put("userId", userId);
        profil.put("promotion", "");
        profil.put("filiere", "");
        profil.put("mention", "");
        profil.put("anneeDiplome", "");
        profil.put("numeroDiplome", "");
        profil.put("posteActuel", null);
        profil.put("entreprise", null);
        profil.put("linkedin", null);
        return profil;
    }

    public List<Map<String, Object>> getOffresPubliques(String secteur, String type, int page, int size) {
        return new ArrayList<>();
    }

    public Map<String, Object> publierOffre(Map<String, Object> body) {
        /* En production : persist l'offre après validation */
        return Map.of("statut", "PUBLIEE", "message", "Offre publiée avec succès");
    }
}
