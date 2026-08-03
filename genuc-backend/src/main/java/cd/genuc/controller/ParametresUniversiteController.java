package cd.genuc.controller;

import cd.genuc.model.ParametresUniversite;
import cd.genuc.service.ParametresUniversiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/parametres")
@RequiredArgsConstructor
public class ParametresUniversiteController {

    private final ParametresUniversiteService parametresService;

    @GetMapping("/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<ParametresUniversite> getParametres(@PathVariable Long universiteId) {
        return ResponseEntity.ok(parametresService.getParametresParUniversite(universiteId));
    }

    @PutMapping("/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')"
            + " and @securityService.peutAccederUniversite(#universiteId, authentication)")
    public ResponseEntity<ParametresUniversite> updateParametres(
            @PathVariable Long universiteId,
            @RequestBody ParametresUniversite parametres) {
        return ResponseEntity.ok(parametresService.updateParametres(universiteId, parametres));
    }
}
