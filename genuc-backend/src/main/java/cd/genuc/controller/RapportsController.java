package cd.genuc.controller;

import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Module Rapports : agrégats par université (académique, RH, financier,
 * bibliothèque, statistiques). Chaque indicateur est calculé défensivement :
 * une requête qui échoue renvoie 0 plutôt que de casser tout le rapport.
 */
@RestController
@RequiredArgsConstructor
public class RapportsController {

    private final JdbcTemplate jdbc;

    @GetMapping("/api/admin/universites/{id}/rapports")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'RECTEUR', 'COMPTABLE', 'RH')")
    public ResponseEntity<?> rapports(@PathVariable Long id,
                                      @AuthenticationPrincipal Utilisateur currentUser) {
        if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE
                && !id.equals(currentUser.getUniversiteId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Vous ne pouvez consulter que les rapports de votre université."));
        }

        Map<String, Object> rapport = new LinkedHashMap<>();

        // ─── Académique ───
        Map<String, Object> academique = new LinkedHashMap<>();
        academique.put("etudiantsActifs", compter(
                "SELECT count(*) FROM utilisateurs WHERE universite_id = ? AND role = 'ETUDIANT' AND actif = true", id));
        academique.put("inscriptionsTotal", compter(
                "SELECT count(*) FROM inscriptions WHERE universite_id = ?", id));
        academique.put("inscriptionsEnAttente", compter(
                "SELECT count(*) FROM inscriptions WHERE universite_id = ? AND statut = 'EN_ATTENTE'", id));
        academique.put("facultes", compter(
                "SELECT count(*) FROM facultes WHERE universite_id = ? AND active = true", id));
        academique.put("departements", compter(
                "SELECT count(*) FROM departements WHERE universite_id = ? AND actif = true", id));
        academique.put("filieres", compter(
                "SELECT count(*) FROM filieres f JOIN departements d ON d.id = f.departement_id "
                        + "WHERE d.universite_id = ? AND f.actif = true", id));
        rapport.put("academique", academique);

        // ─── RH ───
        Map<String, Object> rh = new LinkedHashMap<>();
        rh.put("enseignants", compter(
                "SELECT count(*) FROM utilisateurs WHERE universite_id = ? AND role = 'PROFESSEUR' AND actif = true", id));
        rh.put("personnelAdministratif", compter(
                "SELECT count(*) FROM utilisateurs WHERE universite_id = ? AND actif = true "
                        + "AND role NOT IN ('ETUDIANT', 'PROFESSEUR')", id));
        // Contrats / congés / paies : tables non rattachées à l'université (périmètre global)
        rh.put("contratsActifs", compter("SELECT count(*) FROM contrats WHERE statut ILIKE 'ACTIF%'"));
        rh.put("congesEnAttente", compter("SELECT count(*) FROM conges WHERE statut ILIKE 'EN_ATTENTE%'"));
        rh.put("paiesEnAttente", compter("SELECT count(*) FROM paies WHERE statut ILIKE 'EN_ATTENTE%'"));
        rapport.put("rh", rh);

        // ─── Financier ───
        Map<String, Object> financier = new LinkedHashMap<>();
        financier.put("paiementsTotal", compter(
                "SELECT count(*) FROM paiements WHERE universite_id = ?", id));
        financier.put("montantPaiements", sommer(
                "SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE universite_id = ?", id));
        financier.put("transactionsMobiles", compter(
                "SELECT count(*) FROM transactions WHERE universite_id = ?", id));
        financier.put("montantTransactionsUsd", sommer(
                "SELECT COALESCE(SUM(amount_usd), 0) FROM transactions WHERE universite_id = ?", id));
        rapport.put("financier", financier);

        // ─── Bibliothèque ───
        Map<String, Object> bibliotheque = new LinkedHashMap<>();
        bibliotheque.put("livres", compter(
                "SELECT count(*) FROM livres WHERE universite_id = ? AND actif = true", id));
        bibliotheque.put("empruntsEnCours", compter(
                "SELECT count(*) FROM emprunts e JOIN livres l ON l.id = e.livre_id "
                        + "WHERE l.universite_id = ? AND e.statut ILIKE 'EN_COURS%'", id));
        rapport.put("bibliotheque", bibliotheque);

        // ─── Statistiques : répartition des comptes par rôle ───
        Map<String, Object> statistiques = new LinkedHashMap<>();
        statistiques.put("utilisateursTotal", compter(
                "SELECT count(*) FROM utilisateurs WHERE universite_id = ?", id));
        statistiques.put("utilisateursActifs", compter(
                "SELECT count(*) FROM utilisateurs WHERE universite_id = ? AND actif = true", id));
        statistiques.put("parRole", listerParRole(id));
        rapport.put("statistiques", statistiques);

        return ResponseEntity.ok(rapport);
    }

    private long compter(String sql, Object... args) {
        try {
            Long v = jdbc.queryForObject(sql, Long.class, args);
            return v != null ? v : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private double sommer(String sql, Object... args) {
        try {
            Double v = jdbc.queryForObject(sql, Double.class, args);
            return v != null ? v : 0.0;
        } catch (Exception e) {
            return 0.0;
        }
    }

    private List<Map<String, Object>> listerParRole(Long universiteId) {
        try {
            return jdbc.queryForList(
                    "SELECT role, count(*) AS nombre FROM utilisateurs "
                            + "WHERE universite_id = ? GROUP BY role ORDER BY nombre DESC",
                    universiteId);
        } catch (Exception e) {
            return List.of();
        }
    }
}
