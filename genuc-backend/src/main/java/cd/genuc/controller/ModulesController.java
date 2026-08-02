package cd.genuc.controller;

import cd.genuc.model.Notification;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * CRUD générique des modules d'administration (Communication, Infrastructure,
 * Patrimoine, Recherche). Chaque ressource est déclarée dans un registre en
 * dur : table + colonnes autorisées + type — aucune valeur du client ne touche
 * la construction SQL en dehors des paramètres bindés.
 *
 *   GET    /api/modules/{ressource}?universiteId=X
 *   POST   /api/modules/{ressource}            (body: universiteId + champs)
 *   PUT    /api/modules/{ressource}/{id}
 *   DELETE /api/modules/{ressource}/{id}       (désactivation, pas de suppression)
 */
@RestController
@RequiredArgsConstructor
public class ModulesController {

    private final JdbcTemplate jdbc;
    private final NotificationService notificationService;

    private enum TypeChamp { TEXTE, NOMBRE, DECIMAL, DATE, DATETIME }

    private record Ressource(String table, Map<String, TypeChamp> champs) {}

    private static final Map<String, Ressource> RESSOURCES = Map.ofEntries(
        Map.entry("annonces", new Ressource("annonces", champs(
            "titre", TypeChamp.TEXTE, "contenu", TypeChamp.TEXTE, "type", TypeChamp.TEXTE,
            "date_evenement", TypeChamp.DATETIME, "lieu", TypeChamp.TEXTE, "publie_par", TypeChamp.TEXTE))),
        Map.entry("campus", new Ressource("campus", champs(
            "nom", TypeChamp.TEXTE, "adresse", TypeChamp.TEXTE, "description", TypeChamp.TEXTE))),
        Map.entry("batiments", new Ressource("batiments", champs(
            "campus_id", TypeChamp.NOMBRE, "nom", TypeChamp.TEXTE, "code", TypeChamp.TEXTE,
            "niveaux", TypeChamp.NOMBRE, "description", TypeChamp.TEXTE))),
        Map.entry("salles", new Ressource("salles", champs(
            "batiment_id", TypeChamp.NOMBRE, "nom", TypeChamp.TEXTE, "type", TypeChamp.TEXTE,
            "capacite", TypeChamp.NOMBRE, "equipements", TypeChamp.TEXTE))),
        Map.entry("fournisseurs", new Ressource("fournisseurs", champs(
            "nom", TypeChamp.TEXTE, "contact", TypeChamp.TEXTE, "telephone", TypeChamp.TEXTE,
            "email", TypeChamp.TEXTE, "adresse", TypeChamp.TEXTE))),
        Map.entry("actifs", new Ressource("actifs_patrimoine", champs(
            "type", TypeChamp.TEXTE, "designation", TypeChamp.TEXTE, "code", TypeChamp.TEXTE,
            "valeur", TypeChamp.DECIMAL, "date_acquisition", TypeChamp.DATE, "etat", TypeChamp.TEXTE,
            "localisation", TypeChamp.TEXTE, "fournisseur_id", TypeChamp.NOMBRE))),
        Map.entry("maintenances", new Ressource("maintenances_actifs", champs(
            "actif_id", TypeChamp.NOMBRE, "description", TypeChamp.TEXTE, "cout", TypeChamp.DECIMAL,
            "date_maintenance", TypeChamp.DATE, "statut", TypeChamp.TEXTE))),
        Map.entry("laboratoires", new Ressource("laboratoires", champs(
            "nom", TypeChamp.TEXTE, "domaine", TypeChamp.TEXTE, "responsable", TypeChamp.TEXTE,
            "localisation", TypeChamp.TEXTE))),
        // « montant » = budget du projet (colonne héritée du module professeur)
        Map.entry("projets", new Ressource("projets_recherche", champs(
            "laboratoire_id", TypeChamp.NOMBRE, "titre", TypeChamp.TEXTE, "description", TypeChamp.TEXTE,
            "statut", TypeChamp.TEXTE, "date_debut", TypeChamp.DATE, "date_fin", TypeChamp.DATE,
            "montant", TypeChamp.DECIMAL))),
        Map.entry("publications", new Ressource("publications_recherche", champs(
            "type", TypeChamp.TEXTE, "titre", TypeChamp.TEXTE, "auteurs", TypeChamp.TEXTE,
            "annee", TypeChamp.NOMBRE, "reference", TypeChamp.TEXTE, "lien", TypeChamp.TEXTE)))
    );

    private static Map<String, TypeChamp> champs(Object... paires) {
        Map<String, TypeChamp> m = new LinkedHashMap<>();
        for (int i = 0; i < paires.length; i += 2) {
            m.put((String) paires[i], (TypeChamp) paires[i + 1]);
        }
        return m;
    }

    // ─── Endpoints ──────────────────────────────────────────────────

    @GetMapping("/api/modules/{ressource}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'RECTEUR', 'SECRETAIRE_ACADEMIQUE', 'RH', 'COMPTABLE')")
    public ResponseEntity<?> lister(@PathVariable String ressource,
                                    @RequestParam Long universiteId,
                                    @AuthenticationPrincipal Utilisateur currentUser) {
        Ressource def = RESSOURCES.get(ressource);
        if (def == null) return ressourceInconnue(ressource);
        ResponseEntity<?> refus = verifierPerimetre(currentUser, universiteId);
        if (refus != null) return refus;

        List<Map<String, Object>> lignes = jdbc.queryForList(
                "SELECT * FROM " + def.table() + " WHERE universite_id = ? AND actif = true ORDER BY id DESC",
                universiteId);
        return ResponseEntity.ok(lignes);
    }

    @PostMapping("/api/modules/{ressource}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE', 'RH')")
    @Transactional
    public ResponseEntity<?> creer(@PathVariable String ressource,
                                   @RequestBody Map<String, Object> body,
                                   @AuthenticationPrincipal Utilisateur currentUser) {
        Ressource def = RESSOURCES.get(ressource);
        if (def == null) return ressourceInconnue(ressource);
        Long universiteId = extraireLong(body.get("universiteId"));
        if (universiteId == null) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "universiteId est obligatoire."));
        }
        ResponseEntity<?> refus = verifierPerimetre(currentUser, universiteId);
        if (refus != null) return refus;

        List<String> colonnes = new ArrayList<>(List.of("universite_id"));
        List<Object> valeurs = new ArrayList<>(List.of(universiteId));
        remplir(def, body, colonnes, valeurs);
        if (colonnes.size() == 1) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Aucun champ valide fourni."));
        }

        String sql = "INSERT INTO " + def.table() + " (" + String.join(", ", colonnes) + ") VALUES ("
                + colonnes.stream().map(c -> "?").collect(Collectors.joining(", ")) + ") RETURNING id";
        Long id = jdbc.queryForObject(sql, Long.class, valeurs.toArray());

        // Communication : la publication d'une annonce notifie toute l'université.
        if ("annonces".equals(ressource)) {
            String titre = Objects.toString(body.get("titre"), "Nouvelle annonce");
            String type = Objects.toString(body.get("type"), "ACTUALITE");
            notificationService.envoyerNotificationUniversite(
                    universiteId,
                    "EVENEMENT".equals(type) ? "Nouvel événement" : "Nouvelle annonce",
                    titre,
                    Notification.TypeNotification.INFO,
                    "/actualites");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Élément créé.", "id", id));
    }

    @PutMapping("/api/modules/{ressource}/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE', 'RH')")
    @Transactional
    public ResponseEntity<?> modifier(@PathVariable String ressource,
                                      @PathVariable Long id,
                                      @RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal Utilisateur currentUser) {
        Ressource def = RESSOURCES.get(ressource);
        if (def == null) return ressourceInconnue(ressource);
        ResponseEntity<?> refus = verifierLigne(def, id, currentUser);
        if (refus != null) return refus;

        List<String> colonnes = new ArrayList<>();
        List<Object> valeurs = new ArrayList<>();
        remplir(def, body, colonnes, valeurs);
        if (colonnes.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Aucun champ valide fourni."));
        }
        valeurs.add(id);
        jdbc.update("UPDATE " + def.table() + " SET "
                        + colonnes.stream().map(c -> c + " = ?").collect(Collectors.joining(", "))
                        + " WHERE id = ?",
                valeurs.toArray());
        return ResponseEntity.ok(Map.of("message", "Élément modifié."));
    }

    @DeleteMapping("/api/modules/{ressource}/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<?> desactiver(@PathVariable String ressource,
                                        @PathVariable Long id,
                                        @AuthenticationPrincipal Utilisateur currentUser) {
        Ressource def = RESSOURCES.get(ressource);
        if (def == null) return ressourceInconnue(ressource);
        ResponseEntity<?> refus = verifierLigne(def, id, currentUser);
        if (refus != null) return refus;

        jdbc.update("UPDATE " + def.table() + " SET actif = false WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("message", "Élément supprimé."));
    }

    // ─── Helpers ────────────────────────────────────────────────────

    /** Convertit et ajoute chaque champ autorisé présent dans le body. */
    private void remplir(Ressource def, Map<String, Object> body,
                         List<String> colonnes, List<Object> valeurs) {
        def.champs().forEach((colonne, type) -> {
            if (!body.containsKey(colonne)) return;
            colonnes.add(colonne);
            valeurs.add(convertir(body.get(colonne), type));
        });
    }

    private Object convertir(Object valeur, TypeChamp type) {
        if (valeur == null || (valeur instanceof String s && s.isBlank())) return null;
        String texte = valeur.toString().trim();
        return switch (type) {
            case TEXTE -> texte;
            case NOMBRE -> Long.valueOf(texte);
            case DECIMAL -> new BigDecimal(texte);
            case DATE -> Date.valueOf(LocalDate.parse(texte));
            // Champ datetime-local du navigateur : "2026-07-03T14:30"
            case DATETIME -> Timestamp.valueOf(LocalDateTime.parse(
                    texte.length() == 16 ? texte + ":00" : texte));
        };
    }

    private Long extraireLong(Object valeur) {
        if (valeur == null) return null;
        if (valeur instanceof Number n) return n.longValue();
        try {
            return Long.valueOf(valeur.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private ResponseEntity<?> verifierPerimetre(Utilisateur user, Long universiteId) {
        if (user.getRole() != RoleEnum.SUPER_ADMIN
                && !universiteId.equals(user.getUniversiteId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Vous ne pouvez gérer que les données de votre université."));
        }
        return null;
    }

    private ResponseEntity<?> verifierLigne(Ressource def, Long id, Utilisateur user) {
        List<Long> proprietaires = jdbc.queryForList(
                "SELECT universite_id FROM " + def.table() + " WHERE id = ?", Long.class, id);
        if (proprietaires.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erreur", "Élément introuvable : id=" + id));
        }
        return verifierPerimetre(user, proprietaires.get(0));
    }

    private ResponseEntity<?> ressourceInconnue(String ressource) {
        return ResponseEntity.badRequest().body(Map.of(
                "erreur", "Ressource inconnue : " + ressource,
                "ressourcesDisponibles", RESSOURCES.keySet()));
    }
}
