# Guide de Correction des Problèmes Critiques - Backend GENUC

## 🔴 Problème 1 : Mot de passe en clair dans application-dev.properties

### Localisation
`src/main/resources/application-dev.properties` (ligne 12)

### Problème
Le mot de passe de la base de données est codé en dur en clair (`DB_PASSWORD=4525`)

### Correction Immédiate

#### Étape 1 : Supprimer le mot de passe du fichier
```properties
# AVANT (DANGEREUX)
spring.datasource.password=4525

# APRÈS (CORRECT)
spring.datasource.password=${DB_PASSWORD:}
```

#### Étape 2 : Créer un fichier .env (non versionné)
```bash
# .env (NE PAS COMMITTER CE FICHIER)
DB_PASSWORD=votre_mot_de_passe_secret
```

#### Étape 3 : S'assurer que .env est dans .gitignore
```gitignore
# Ajouter si absent
.env
*.local
application-dev.properties
```

#### Étape 4 : Rotation du mot de passe (recommandé)
```sql
-- Dans PostgreSQL
ALTER USER genuc_user WITH PASSWORD 'nouveau_mot_de_passe_secure';
```

#### Étape 5 : Mettre à jour les variables d'environnement de production
```bash
export DB_PASSWORD='nouveau_mot_de_passe_secure'
```

---

## 🔴 Problème 2 : Utilisation excessive de RuntimeException

### Problème
De nombreuses exceptions sont lancées avec `RuntimeException` au lieu d'exceptions typées.

### Exemples identifiés
- `NoteService.java` ligne 49: `new RuntimeException("Inscription introuvable")`
- `PaiementService.java` ligne 54: `new RuntimeException("Cette inscription ne correspond pas a cette universite")`
- `InscriptionPubliqueService.java` ligne 117: `new RuntimeException("Un dossier existe déjà avec cet email")`

### Correction : Créer des exceptions typées

#### Étape 1 : Créer les nouvelles exceptions
```java
// src/main/java/cd/genuc/exception/InscriptionNotFoundException.java
package cd.genuc.exception;

public class InscriptionNotFoundException extends RuntimeException {
    private final Long inscriptionId;

    public InscriptionNotFoundException(Long inscriptionId) {
        super("Inscription introuvable avec l'ID: " + inscriptionId);
        this.inscriptionId = inscriptionId;
    }

    public Long getInscriptionId() {
        return inscriptionId;
    }
}

// src/main/java/cd/genuc/exception/UniversiteMismatchException.java
package cd.genuc.exception;

public class UniversiteMismatchException extends RuntimeException {
    private final Long inscriptionId;
    private final Long universiteId;

    public UniversiteMismatchException(Long inscriptionId, Long universiteId) {
        super("Cette inscription ne correspond pas à cette université");
        this.inscriptionId = inscriptionId;
        this.universiteId = universiteId;
    }

    public Long getInscriptionId() {
        return inscriptionId;
    }

    public Long getUniversiteId() {
        return universiteId;
    }
}

// src/main/java/cd/genuc/exception/DossierEmailAlreadyExistsException.java
package cd.genuc.exception;

public class DossierEmailAlreadyExistsException extends RuntimeException {
    private final String email;

    public DossierEmailAlreadyExistsException(String email) {
        super("Un dossier existe déjà avec cet email: " + email);
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}
```

#### Étape 2 : Ajouter les handlers dans GlobalExceptionHandler
```java
// Dans GlobalExceptionHandler.java

@ExceptionHandler(InscriptionNotFoundException.class)
public ResponseEntity<?> handleInscriptionNotFound(InscriptionNotFoundException e) {
    log.warn("Inscription non trouvée : {}", e.getMessage());
    String msg = getMessage("error.inscription.notfound", e.getInscriptionId());
    return erreur(HttpStatus.NOT_FOUND, "INSCRIPTION_NOT_FOUND", msg);
}

@ExceptionHandler(UniversiteMismatchException.class)
public ResponseEntity<?> handleUniversiteMismatch(UniversiteMismatchException e) {
    log.warn("Mismatch université : inscription={}, université={}", 
        e.getInscriptionId(), e.getUniversiteId());
    String msg = getMessage("error.universite.mismatch");
    return erreur(HttpStatus.FORBIDDEN, "UNIVERSITE_MISMATCH", msg);
}

@ExceptionHandler(DossierEmailAlreadyExistsException.class)
public ResponseEntity<?> handleDossierEmailExists(DossierEmailAlreadyExistsException e) {
    log.warn("Email dossier déjà utilisé : {}", e.getEmail());
    String msg = getMessage("error.dossier.email.exists", e.getEmail());
    return erreur(HttpStatus.CONFLICT, "DOSSIER_EMAIL_EXISTS", msg);
}
```

#### Étape 3 : Remplacer les RuntimeException dans les services
```java
// AVANT (Dans NoteService.java)
if (inscription == null) {
    throw new RuntimeException("Inscription introuvable");
}

// APRÈS
if (inscription == null) {
    throw new InscriptionNotFoundException(inscriptionId);
}

// AVANT (Dans PaiementService.java)
if (!inscription.getUniversite().getId().equals(universiteId)) {
    throw new RuntimeException("Cette inscription ne correspond pas a cette universite");
}

// APRÈS
if (!inscription.getUniversite().getId().equals(universiteId)) {
    throw new UniversiteMismatchException(inscriptionId, universiteId);
}

// AVANT (Dans InscriptionPubliqueService.java)
if (dossierRepo.existsByEmail(email)) {
    throw new RuntimeException("Un dossier existe déjà avec cet email");
}

// APRÈS
if (dossierRepo.existsByEmail(email)) {
    throw new DossierEmailAlreadyExistsException(email);
}
```

---

## 🔴 Problème 3 : Validation des entrées insuffisante

### Problème
De nombreux endpoints acceptent `Map<String, Object>` au lieu de DTOs validés.

### Exemples identifiés
- `AuthController.inscrire()` (ligne 51)
- `EtudiantController.creerOuRetourner()` (ligne 33)
- `NoteController.saisir()` (ligne 42)

### Correction : Créer des DTOs validés

#### Étape 1 : Créer les DTOs request
```java
// src/main/java/cd/genuc/dto/request/InscriptionRequest.java
package cd.genuc.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class InscriptionRequest {
    
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format email invalide")
    private String email;
    
    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    private String nom;
    
    @NotBlank(message = "Le prénom est obligatoire")
    @Size(min = 2, max = 100, message = "Le prénom doit contenir entre 2 et 100 caractères")
    private String prenom;
    
    @NotNull(message = "L'ID de la filière est obligatoire")
    private Long filiereId;
    
    @NotNull(message = "L'ID de la promotion est obligatoire")
    private Long promotionId;
    
    @Pattern(regexp = "^\\+243[0-9]{9}$", message = "Format téléphone invalide (ex: +243123456789)")
    private String telephone;
}

// src/main/java/cd/genuc/dto/request/NoteRequest.java
package cd.genuc.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class NoteRequest {
    
    @NotNull(message = "L'ID de l'inscription est obligatoire")
    private Long inscriptionId;
    
    @NotNull(message = "L'ID du cours est obligatoire")
    private Long coursId;
    
    @NotNull(message = "La note est obligatoire")
    @DecimalMin(value = "0.0", message = "La note ne peut pas être négative")
    @DecimalMax(value = "20.0", message = "La note ne peut pas dépasser 20")
    private Double note;
    
    private String appreciation;
    
    private Long semestreId;
}
```

#### Étape 2 : Mettre à jour les contrôleurs
```java
// AVANT (Dans AuthController.java)
@PostMapping("/inscrire")
public ResponseEntity<?> inscrire(@RequestBody Map<String, Object> body) {
    try {
        String email = (String) body.get("email");
        String nom = (String) body.get("nom");
        // Validation manuelle...
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
    }
}

// APRÈS
@PostMapping("/inscrire")
public ResponseEntity<?> inscrire(@Valid @RequestBody InscriptionRequest request) {
    try {
        Utilisateur utilisateur = authService.inscrire(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(utilisateur);
    } catch (EmailAlreadyExistsException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("erreur", e.getMessage()));
    }
}

// AVANT (Dans NoteController.java)
@PostMapping("/saisir")
public ResponseEntity<?> saisir(@RequestBody Map<String, Object> body) {
    try {
        Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
        Double note = Double.valueOf(body.get("note").toString());
        // ...
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
    }
}

// APRÈS
@PostMapping("/saisir")
public ResponseEntity<?> saisir(@Valid @RequestBody NoteRequest request) {
    try {
        Note note = noteService.saisirNote(request);
        return ResponseEntity.ok(note);
    } catch (BusinessException e) {
        return ResponseEntity.badRequest()
            .body(Map.of("erreur", e.getMessage()));
    }
}
```

---

## 🔴 Problème 4 : Open Session in View activé

### Localisation
`src/main/resources/application.yml` (lignes 63-66)

### Problème
`spring.jpa.open-in-view` reste à `true` par défaut, causant des problèmes N+1.

### Correction

#### Étape 1 : Désactiver Open Session in View
```yaml
# application.yml
spring:
  jpa:
    open-in-view: false  # Désactiver explicitement
    show-sql: true      # Activer les logs SQL en dev pour détecter les N+1
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true
```

#### Étape 2 : Optimiser les repositories avec JOIN FETCH
```java
// AVANT
@Query("SELECT i FROM Inscription i WHERE i.id = :id")
Inscription findById(Long id);

// APRÈS
@Query("SELECT i FROM Inscription i LEFT JOIN FETCH i.etudiant LEFT JOIN FETCH i.filiere WHERE i.id = :id")
Inscription findByIdWithDetails(@Param("id") Long id);
```

#### Étape 3 : Ajouter @Transactional(readOnly = true) sur les méthodes de lecture
```java
@Service
@RequiredArgsConstructor
public class EtudiantService {
    
    @Transactional(readOnly = true)
    public Inscription getInscription(Long id) {
        return inscriptionRepository.findByIdWithDetails(id)
            .orElseThrow(() -> new InscriptionNotFoundException(id));
    }
}
```

#### Étape 4 : Migrer les contrôleurs vers des DTOs
```java
// AVANT (Retourne une entité JPA)
@GetMapping("/{id}")
public Inscription getInscription(@PathVariable Long id) {
    return inscriptionService.getInscription(id);
}

// APRÈS (Retourne un DTO)
@GetMapping("/{id}")
public InscriptionResponse getInscription(@PathVariable Long id) {
    Inscription inscription = inscriptionService.getInscription(id);
    return inscriptionMapper.toResponse(inscription);
}
```

---

## 📋 Checklist de Correction

### Immédiat (Aujourd'hui)
- [ ] Supprimer le mot de passe de `application-dev.properties`
- [ ] Créer le fichier `.env` avec les variables d'environnement
- [ ] Ajouter `.env` au `.gitignore`
- [ ] Désactiver `spring.jpa.open-in-view`

### Cette semaine
- [ ] Créer les 3 exceptions typées principales
- [ ] Ajouter les handlers dans `GlobalExceptionHandler`
- [ ] Identifier tous les `RuntimeException` dans le code
- [ ] Remplacer les `RuntimeException` par des exceptions typées

### Ce mois
- [ ] Créer les DTOs request pour les endpoints critiques
- [ ] Migrer les contrôleurs principaux vers les DTOs
- [ ] Optimiser les repositories avec JOIN FETCH
- [ ] Ajouter `@Transactional(readOnly = true)` sur les lectures

---

## 🧪 Tests de Validation

### Test 1 : Vérifier que le mot de passe n'est plus en clair
```bash
# Vérifier que le fichier ne contient plus le mot de passe
grep -r "4525" src/main/resources/
# Ne doit rien retourner
```

### Test 2 : Tester les nouvelles exceptions
```bash
# Tester que les nouvelles exceptions fonctionnent
curl -X POST http://localhost:8082/api/notes/saisir \
  -H "Content-Type: application/json" \
  -d '{"inscriptionId":999999,"note":15}'
# Doit retourner 404 avec "INSCRIPTION_NOT_FOUND"
```

### Test 3 : Tester la validation des DTOs
```bash
# Tester que la validation fonctionne
curl -X POST http://localhost:8082/api/auth/inscrire \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","nom":"Test"}'
# Doit retourner 400 avec erreur de validation email
```

### Test 4 : Vérifier que OSIV est désactivé
```bash
# Démarrer l'application et vérifier les logs
# Doit voir des LazyInitializationException si les requêtes ne sont pas optimisées
mvn spring-boot:run
```

---

## 📞 Support

En cas de problème lors de la correction :

1. **Mot de passe** : Consulter l'équipe DevOps pour la rotation
2. **Exceptions** : Vérifier `GlobalExceptionHandler` pour les handlers manquants
3. **DTOs** : Suivre le pattern des DTOs existants dans le package `dto/`
4. **OSIV** : Activer temporairement les logs SQL pour identifier les N+1

---

**Guide créé le** : 2026-07-24  
**Priorité** : 🔴 CRITIQUE  
**Statut** : Prêt pour implémentation
