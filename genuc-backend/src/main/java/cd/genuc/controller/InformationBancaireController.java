package cd.genuc.controller;

import cd.genuc.model.InformationBancaire;
import cd.genuc.model.Universite;
import cd.genuc.repository.InformationBancaireRepository;
import cd.genuc.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 🏦 Coordonnées bancaires par université — utilisées par les bons de paiement (QR code).
 */
@RestController
@RequestMapping("/api/informations-bancaires")
@RequiredArgsConstructor
public class InformationBancaireController {

    private final InformationBancaireRepository repository;
    private final UniversiteRepository universiteRepository;
    private final cd.genuc.service.CoordonneesBancairesService coordonneesBancairesService;

    /**
     * Comptes d'un établissement — y compris pour l'ÉTUDIANT, qui doit pouvoir choisir
     * la banque où il ira régler son bon (ces coordonnées figurent de toute façon en
     * clair sur le bon de caisse qu'il télécharge).
     *
     * <p>Le garde multi-tenant reste appliqué : un compte ne peut lire que les banques
     * de SON établissement, un étudiant curieux ne parcourt pas les comptes des autres
     * universités en changeant l'identifiant.</p>
     */
    @GetMapping("/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'COMPTABLE', 'CAISSIER', 'AGENT', 'ETUDIANT') "
                + "and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<?> lister(@PathVariable Long universiteId) {
        return ResponseEntity.ok(repository.findByUniversiteId(universiteId));
    }

    /** Comptes actifs uniquement, mis en forme — ce que consomme le portail étudiant. */
    @GetMapping("/universite/{universiteId}/actifs")
    @PreAuthorize("isAuthenticated() "
                + "and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<?> listerActifs(@PathVariable Long universiteId) {
        return ResponseEntity.ok(coordonneesBancairesService.pourAffichage(universiteId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creer(@RequestBody Map<String, Object> body) {
        try {
            Long universiteId = Long.valueOf(body.get("universiteId").toString());
            Universite universite = universiteRepository.findById(universiteId)
                    .orElseThrow(() -> new RuntimeException("Université introuvable"));

            InformationBancaire info = InformationBancaire.builder()
                    .universite(universite)
                    .nomBanque((String) body.get("nomBanque"))
                    .intituleCompte((String) body.get("intituleCompte"))
                    .numeroCompte((String) body.get("numeroCompte"))
                    .devise((String) body.getOrDefault("devise", "USD"))
                    .codeBanque((String) body.get("codeBanque"))
                    .swiftCode((String) body.get("swiftCode"))
                    .iban((String) body.get("iban"))
                    .instructionsPaiement((String) body.get("instructionsPaiement"))
                    .actif(true)
                    .build();

            return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(info));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> modifier(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            InformationBancaire info = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Information bancaire introuvable"));

            if (body.containsKey("nomBanque")) info.setNomBanque((String) body.get("nomBanque"));
            if (body.containsKey("intituleCompte")) info.setIntituleCompte((String) body.get("intituleCompte"));
            if (body.containsKey("numeroCompte")) info.setNumeroCompte((String) body.get("numeroCompte"));
            if (body.containsKey("devise")) info.setDevise((String) body.get("devise"));
            if (body.containsKey("codeBanque")) info.setCodeBanque((String) body.get("codeBanque"));
            if (body.containsKey("swiftCode")) info.setSwiftCode((String) body.get("swiftCode"));
            if (body.containsKey("iban")) info.setIban((String) body.get("iban"));
            if (body.containsKey("instructionsPaiement")) info.setInstructionsPaiement((String) body.get("instructionsPaiement"));
            if (body.containsKey("actif")) info.setActif((Boolean) body.get("actif"));

            return ResponseEntity.ok(repository.save(info));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> supprimer(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", "Introuvable"));
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
