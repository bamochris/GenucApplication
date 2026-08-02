package cd.genuc.controller;

import cd.genuc.service.ClassementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/classement")
@RequiredArgsConstructor
public class ClassementController {

    private final ClassementService classementService;

    @GetMapping("/cours/{coursId}/{annee}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> classementCours(@PathVariable Long coursId, @PathVariable String annee) {
        return ResponseEntity.ok(classementService.getClassementCours(coursId, annee));
    }
}