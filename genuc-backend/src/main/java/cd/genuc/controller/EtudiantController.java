package cd.genuc.controller;

import cd.genuc.model.Etudiant;
import cd.genuc.model.Inscription;
import cd.genuc.repository.EtudiantRepository;
import cd.genuc.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/etudiants")
@RequiredArgsConstructor
public class EtudiantController {

    private final EtudiantRepository etudiantRepository;
    private final InscriptionRepository inscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Crée un étudiant ou retourne celui qui existe déjà.
     * Le motDePasse est stocké temporairement pour être utilisé lors de la validation.
     *
     * <p><b>Réservé au personnel.</b> Cet endpoint était accessible sans authentification :
     * sa réponse distingue un étudiant existant d'un étudiant créé, ce qui permettait de
     * tester massivement des adresses email (énumération de comptes) et de remplir la
     * table {@code etudiants} à volonté. La soumission d'inscription publique n'utilise
     * pas cette route — elle passe par {@code /api/public/inscription} et
     * {@code /api/dossiers}, qui créent l'étudiant côté serveur.</p>
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SECRETAIRE_ACADEMIQUE', 'APPARITEUR', 'AGENT', 'CAISSIER', "
                + "'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creerOuRetourner(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("email")) {
                return ResponseEntity.badRequest().body(Map.of("message", "L'email est obligatoire."));
            }
            
            String email = (String) body.get("email");
            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "L'email est obligatoire."));
            }

            // Si l'étudiant existe déjà, retourner son ID
            return etudiantRepository.findByEmail(email.toLowerCase().trim())
                .map(existant -> ResponseEntity.ok(Map.of(
                    "id", existant.getId(),
                    "message", "Étudiant déjà enregistré",
                    "nouveau", false
                )))
                .orElseGet(() -> {
                    Etudiant etudiant = Etudiant.builder()
                        .nom(body.getOrDefault("nom", "").toString().toUpperCase())
                        .prenom(body.getOrDefault("prenom", "").toString())
                        .email(email.toLowerCase().trim())
                        .telephone(body.getOrDefault("telephone", "").toString())
                        .sexe(body.getOrDefault("sexe", "M").toString())
                        .adresse(body.getOrDefault("adresse", "").toString())
                        .lieuNaissance(body.getOrDefault("lieuNaissance", "").toString())
                        .actif(true)
                        .build();

                    // Stocker le mot de passe choisi par l'étudiant — HACHÉ dès la collecte.
                    // Le hash sera repris tel quel à la validation de l'inscription
                    // (InscriptionController) : le mot de passe en clair ne touche jamais la base.
                    if (body.containsKey("motDePasse") && body.get("motDePasse") != null
                            && !body.get("motDePasse").toString().isBlank()) {
                        etudiant.setMotDePasseTemporaire(passwordEncoder.encode(body.get("motDePasse").toString()));
                    }

                    // Date de naissance
                    if (body.containsKey("dateNaissance") && body.get("dateNaissance") != null 
                            && !body.get("dateNaissance").toString().isBlank()) {
                        etudiant.setDateNaissance(LocalDate.parse(body.get("dateNaissance").toString()));
                    }

                    Etudiant sauvegarde = etudiantRepository.save(etudiant);
                    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                        "id", sauvegarde.getId(),
                        "message", "Étudiant créé avec succès",
                        "nouveau", true
                    ));
                });

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Recherche d'un étudiant par email — réservée au personnel.
     *
     * <p>Sans restriction de rôle, n'importe quel compte authentifié (un étudiant, donc)
     * pouvait vérifier l'existence d'une adresse et récupérer le nom et le prénom
     * associés : collecte d'identités et préparation de hameçonnage.</p>
     */
    @GetMapping("/email/{email}")
    @PreAuthorize("hasAnyRole('SECRETAIRE_ACADEMIQUE', 'APPARITEUR', 'AGENT', 'CAISSIER', "
                + "'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> parEmail(@PathVariable String email) {
        return etudiantRepository.findByEmail(email.toLowerCase())
            .map(e -> ResponseEntity.ok(Map.of(
                "id", e.getId(),
                "nom", e.getNom(),
                "prenom", e.getPrenom()
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Recherche d'un étudiant par matricule pour la caisse (TachPayCheckout).
     * Renvoie {"data": {...}} avec l'inscription active et son contexte
     * (filière, promotion, université) — format attendu par le frontend.
     */
    @GetMapping("/recherche")
    @PreAuthorize("hasAnyRole('CAISSIER', 'AGENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> rechercher(@RequestParam String q) {
        if (q == null || q.trim().length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("message", "Veuillez saisir au moins 3 caractères"));
        }
        return inscriptionRepository.findByMatricule(q.trim())
            .<ResponseEntity<?>>map(i -> ResponseEntity.ok(Map.of("data", versDetail(i))))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Aucun étudiant trouvé pour le matricule " + q.trim())));
    }

    private Map<String, Object> versDetail(Inscription i) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("inscriptionId", i.getId());
        d.put("matricule", i.getMatricule());
        d.put("nom", i.getNom());
        d.put("prenom", i.getPrenom());
        d.put("email", i.getEmail());
        d.put("telephone", i.getTelephone());
        d.put("niveau", i.getNiveau());
        if (i.getFiliere() != null) d.put("filiereNom", i.getFiliere().getNom());
        if (i.getPromotion() != null) d.put("promotionLibelle", i.getPromotion().getLibelle());
        if (i.getUniversite() != null) {
            d.put("universiteId", i.getUniversite().getId());
            d.put("universiteNom", i.getUniversite().getNom());
        }
        if (i.getDepartement() != null && i.getDepartement().getFaculte() != null) {
            d.put("faculteNom", i.getDepartement().getFaculte().getNom());
        }
        if (i.getAnneeAcademique() != null) d.put("anneeScolaire", i.getAnneeAcademique().getLibelle());
        return d;
    }
}