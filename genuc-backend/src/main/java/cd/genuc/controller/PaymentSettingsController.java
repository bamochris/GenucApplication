package cd.genuc.controller;

import cd.genuc.model.RoleEnum;
import cd.genuc.model.Universite;
import cd.genuc.model.UniversitePaymentSettings;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.UniversitePaymentSettingsRepository;
import cd.genuc.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Comptes d'encaissement de l'université : numéros marchands mobile money
 * (M-Pesa, Orange Money, Airtel Money), compte bancaire pour carte/virement
 * et acceptation des espèces. Configurés par l'admin de l'université.
 */
@RestController
@RequiredArgsConstructor
public class PaymentSettingsController {

    private final UniversitePaymentSettingsRepository settingsRepo;
    private final UniversiteRepository universiteRepo;

    // Un ADMIN_UNIVERSITE ne touche qu'à sa propre université.
    private boolean accesRefuse(Utilisateur user, Long universiteId) {
        return user.getRole() == RoleEnum.ADMIN_UNIVERSITE
                && !universiteId.equals(user.getUniversiteId());
    }

    private Map<String, Object> versMap(UniversitePaymentSettings s) {
        Map<String, Object> m = new HashMap<>();
        m.put("universiteId", s.getUniversite() != null ? s.getUniversite().getId() : null);
        m.put("primaryCurrency", s.getPrimaryCurrency());
        m.put("allowPartialPayments", s.getAllowPartialPayments());
        m.put("mpesaNumero", s.getMpesaNumero());
        m.put("orangeMoneyNumero", s.getOrangeMoneyNumero());
        m.put("airtelMoneyNumero", s.getAirtelMoneyNumero());
        m.put("banqueNom", s.getBanqueNom());
        m.put("banqueCompte", s.getBanqueCompte());
        m.put("banqueSwift", s.getBanqueSwift());
        m.put("banqueTitulaire", s.getBanqueTitulaire());
        m.put("accepteEspeces", s.getAccepteEspeces());
        return m;
    }

    @GetMapping("/api/admin/universites/{id}/parametres-paiement")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'COMPTABLE')")
    public ResponseEntity<?> obtenir(@PathVariable Long id,
                                     @AuthenticationPrincipal Utilisateur currentUser) {
        if (accesRefuse(currentUser, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Vous ne pouvez consulter que les paramètres de votre université."));
        }
        UniversitePaymentSettings settings = settingsRepo.findByUniversiteId(id)
                .orElseGet(() -> {
                    Universite uni = universiteRepo.findById(id)
                            .orElseThrow(() -> new RuntimeException("Université introuvable : id=" + id));
                    return UniversitePaymentSettings.builder().universite(uni).build();
                });
        return ResponseEntity.ok(versMap(settings));
    }

    @PutMapping("/api/admin/universites/{id}/parametres-paiement")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<?> modifier(@PathVariable Long id,
                                      @RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal Utilisateur currentUser) {
        if (accesRefuse(currentUser, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Vous ne pouvez modifier que les paramètres de votre université."));
        }
        Universite uni = universiteRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Université introuvable : id=" + id));

        UniversitePaymentSettings settings = settingsRepo.findByUniversiteId(id)
                .orElseGet(() -> UniversitePaymentSettings.builder().universite(uni).build());

        if (body.containsKey("primaryCurrency"))     settings.setPrimaryCurrency((String) body.get("primaryCurrency"));
        if (body.containsKey("allowPartialPayments")) settings.setAllowPartialPayments((Boolean) body.get("allowPartialPayments"));
        if (body.containsKey("mpesaNumero"))         settings.setMpesaNumero(nettoyer(body.get("mpesaNumero")));
        if (body.containsKey("orangeMoneyNumero"))   settings.setOrangeMoneyNumero(nettoyer(body.get("orangeMoneyNumero")));
        if (body.containsKey("airtelMoneyNumero"))   settings.setAirtelMoneyNumero(nettoyer(body.get("airtelMoneyNumero")));
        if (body.containsKey("banqueNom"))           settings.setBanqueNom(nettoyer(body.get("banqueNom")));
        if (body.containsKey("banqueCompte"))        settings.setBanqueCompte(nettoyer(body.get("banqueCompte")));
        if (body.containsKey("banqueSwift"))         settings.setBanqueSwift(nettoyer(body.get("banqueSwift")));
        if (body.containsKey("banqueTitulaire"))     settings.setBanqueTitulaire(nettoyer(body.get("banqueTitulaire")));
        if (body.containsKey("accepteEspeces"))      settings.setAccepteEspeces((Boolean) body.get("accepteEspeces"));
        settings.setUpdatedBy(currentUser);

        settingsRepo.save(settings);
        return ResponseEntity.ok(Map.of("message", "Paramètres de paiement enregistrés."));
    }

    /**
     * Moyens de paiement affichés aux étudiants (lecture seule, champs publics
     * uniquement — les numéros marchands sont faits pour être communiqués).
     */
    @GetMapping("/api/universites/{id}/moyens-paiement")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> moyensPaiement(@PathVariable Long id) {
        return settingsRepo.findByUniversiteId(id)
                .<ResponseEntity<?>>map(s -> ResponseEntity.ok(versMap(s)))
                .orElseGet(() -> ResponseEntity.ok(Map.of(
                        "universiteId", id,
                        "accepteEspeces", true,
                        "message", "Moyens de paiement non encore configurés par l'université."
                )));
    }

    private String nettoyer(Object valeur) {
        if (valeur == null) return null;
        String s = valeur.toString().trim();
        return s.isEmpty() ? null : s;
    }
}
