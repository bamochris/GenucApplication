package cd.genuc.controller;

import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import cd.genuc.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    /**
     * GET /api/utilisateurs
     * Supports optional query params: ?role=RECTEUR  or  ?universiteId=3
     * SUPER_ADMIN sees all; ADMIN_UNIVERSITE sees only their university.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> getAllUtilisateurs(
            @AuthenticationPrincipal Utilisateur currentUser,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long universiteId) {

        List<Utilisateur> utilisateurs;
        RoleEnum roleEnum = null;
        if (role != null && !role.isBlank()) {
            try { roleEnum = RoleEnum.valueOf(role); } catch (IllegalArgumentException ignored) {}
        }

        if (currentUser.getRole() == RoleEnum.SUPER_ADMIN) {
            if (roleEnum != null && universiteId != null) {
                utilisateurs = utilisateurService.findByRoleAndUniversite(roleEnum, universiteId);
            } else if (roleEnum != null) {
                utilisateurs = utilisateurService.findByRole(roleEnum);
            } else if (universiteId != null) {
                utilisateurs = utilisateurService.findByUniversiteId(universiteId);
            } else {
                utilisateurs = utilisateurService.findAll();
            }
        } else {
            // ADMIN_UNIVERSITE : always scoped to own university
            Long uniId = currentUser.getUniversiteId();
            if (roleEnum != null) {
                utilisateurs = utilisateurService.findByRoleAndUniversite(roleEnum, uniId);
            } else {
                utilisateurs = utilisateurService.findByUniversiteId(uniId);
            }
        }

        return ResponseEntity.ok(Map.of("total", utilisateurs.size(), "utilisateurs", utilisateurs));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getUtilisateurById(@PathVariable Long id,
                                                 @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            Utilisateur utilisateur = utilisateurService.findById(id);
            if (!canAccessUtilisateur(currentUser, utilisateur)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Accès non autorisé à cet utilisateur"));
            }
            return ResponseEntity.ok(utilisateur);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        }
    }

    /**
     * POST /api/utilisateurs
     * Crée un utilisateur (staff) avec son mot de passe haché.
     * Le compte est activé directement (compteActive = true) car c'est un admin qui crée le compte.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> createUtilisateur(@RequestBody Map<String, Object> body,
                                                @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            String nom    = (String) body.get("nom");
            String prenom = (String) body.get("prenom");
            String email  = (String) body.get("email");
            String tel    = (String) body.get("telephone");
            String pwd    = (String) body.get("motDePasse");
            String roleStr = (String) body.get("role");
            Long uniId    = body.get("universiteId") != null
                ? Long.valueOf(body.get("universiteId").toString()) : null;
            Long deptId   = body.get("departementId") != null
                ? Long.valueOf(body.get("departementId").toString()) : null;

            if (nom == null || prenom == null || email == null || pwd == null || roleStr == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Champs obligatoires manquants"));
            }

            RoleEnum roleEnum;
            try { roleEnum = RoleEnum.valueOf(roleStr); }
            catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Rôle invalide : " + roleStr));
            }

            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
                if (uniId == null) {
                    return ResponseEntity.badRequest().body(Map.of("erreur", "L'université est obligatoire"));
                }
                if (!uniId.equals(currentUser.getUniversiteId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("erreur", "Vous ne pouvez créer que des utilisateurs dans votre université"));
                }
                if (roleEnum == RoleEnum.SUPER_ADMIN || roleEnum == RoleEnum.ADMIN_UNIVERSITE) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("erreur", "Vous n'avez pas les droits pour créer ce type d'utilisateur"));
                }
            }

            if (roleEnum == RoleEnum.SUPER_ADMIN && currentUser.getRole() != RoleEnum.SUPER_ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Seul un SUPER_ADMIN peut créer un autre SUPER_ADMIN"));
            }

            if (utilisateurService.emailExiste(email)) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Cet email est déjà utilisé"));
            }

            Utilisateur saved = utilisateurService.creerUtilisateurAdmin(
                nom, prenom, email, tel, pwd, roleEnum, uniId, deptId);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Utilisateur créé avec succès",
                "id",      saved.getId(),
                "email",   saved.getEmail(),
                "role",    saved.getRole().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateUtilisateur(@PathVariable Long id,
                                                @RequestBody Utilisateur utilisateurDetails,
                                                @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            Utilisateur existing = utilisateurService.findById(id);
            if (!canModifyUtilisateur(currentUser, existing)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Vous n'avez pas les droits pour modifier cet utilisateur"));
            }
            if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
                utilisateurDetails.setRole(existing.getRole());
            }
            Utilisateur updated = utilisateurService.update(id, utilisateurDetails);
            return ResponseEntity.ok(Map.of(
                "message", "Utilisateur modifié avec succès",
                "id",    updated.getId(),
                "email", updated.getEmail(),
                "role",  updated.getRole().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> deleteUtilisateur(@PathVariable Long id,
                                                @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            Utilisateur utilisateur = utilisateurService.findById(id);
            if (!canDeleteUtilisateur(currentUser, utilisateur)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Vous n'avez pas les droits pour supprimer cet utilisateur"));
            }
            utilisateurService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Utilisateur désactivé avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    /**
     * DELETE /api/utilisateurs/{id}/definitif
     * Suppression DÉFINITIVE (hard delete) du compte, réservée au SUPER_ADMIN et à
     * l'ADMIN_UNIVERSITE (dans son périmètre). Refuse proprement si l'utilisateur a
     * des données liées : l'admin doit alors le désactiver plutôt que le supprimer.
     */
    @DeleteMapping("/{id}/definitif")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> supprimerDefinitivement(@PathVariable Long id,
                                                      @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            Utilisateur utilisateur = utilisateurService.findById(id);
            if (!canDeleteUtilisateur(currentUser, utilisateur)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Vous n'avez pas les droits pour supprimer cet utilisateur"));
            }
            utilisateurService.supprimerDefinitivement(id);
            return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé définitivement"));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("erreur", "Impossible de supprimer définitivement : cet utilisateur possède des "
                    + "données liées (inscriptions, paiements, notes…). Désactivez-le plutôt."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    /** PATCH /api/utilisateurs/{id}/desactiver */
    @PatchMapping("/{id}/desactiver")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> desactiver(@PathVariable Long id,
                                         @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            Utilisateur target = utilisateurService.findById(id);
            if (!canModifyUtilisateur(currentUser, target)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Accès non autorisé"));
            }
            Utilisateur updated = utilisateurService.setActif(id, false);
            return ResponseEntity.ok(Map.of("message", "Compte désactivé", "actif", updated.isActif()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    /** PATCH /api/utilisateurs/{id}/activer */
    @PatchMapping("/{id}/activer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> activer(@PathVariable Long id,
                                      @AuthenticationPrincipal Utilisateur currentUser) {
        try {
            Utilisateur target = utilisateurService.findById(id);
            if (!canModifyUtilisateur(currentUser, target)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Accès non autorisé"));
            }
            Utilisateur updated = utilisateurService.setActif(id, true);
            return ResponseEntity.ok(Map.of("message", "Compte réactivé", "actif", updated.isActif()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/recherche")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> rechercher(@RequestParam String nom,
                                         @AuthenticationPrincipal Utilisateur currentUser) {
        List<Utilisateur> resultats = utilisateurService.rechercherParNom(nom);
        if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
            resultats = resultats.stream()
                .filter(u -> currentUser.getUniversiteId().equals(u.getUniversiteId()))
                .toList();
        }
        return ResponseEntity.ok(Map.of("total", resultats.size(), "resultats", resultats));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private boolean canAccessUtilisateur(Utilisateur currentUser, Utilisateur target) {
        if (currentUser.getRole() == RoleEnum.SUPER_ADMIN) return true;
        if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
            return currentUser.getUniversiteId().equals(target.getUniversiteId());
        }
        return currentUser.getId().equals(target.getId());
    }

    private boolean canModifyUtilisateur(Utilisateur currentUser, Utilisateur target) {
        if (currentUser.getRole() == RoleEnum.SUPER_ADMIN) return true;
        if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
            if (target.getRole() == RoleEnum.SUPER_ADMIN) return false;
            return currentUser.getUniversiteId().equals(target.getUniversiteId());
        }
        return currentUser.getId().equals(target.getId());
    }

    private boolean canDeleteUtilisateur(Utilisateur currentUser, Utilisateur target) {
        if (currentUser.getRole() == RoleEnum.SUPER_ADMIN) {
            return !currentUser.getId().equals(target.getId());
        }
        if (currentUser.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
            if (target.getRole() == RoleEnum.SUPER_ADMIN) return false;
            if (target.getRole() == RoleEnum.ADMIN_UNIVERSITE) return false;
            return currentUser.getUniversiteId().equals(target.getUniversiteId());
        }
        return false;
    }
}
