package cd.genuc.config;

import cd.genuc.dto.ApiResponse;
import cd.genuc.exception.*;
import cd.genuc.exception.UniversiteMismatchException;
import cd.genuc.exception.DossierEmailAlreadyExistsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.HttpRequestMethodNotSupportedException;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    private String getMessage(String code, Object... args) {
        try {
            return messageSource.getMessage(code, args, LocaleContextHolder.getLocale());
        } catch (Exception e) {
            return code;
        }
    }

    private ResponseEntity<ApiResponse<Void>> erreur(HttpStatus statut, String code, String message) {
        return ResponseEntity.status(statut)
            .body(ApiResponse.error(code, message, statut.value()));
    }

    // ─── NOT FOUND (404) ─────────────────────────────────────────────

    @ExceptionHandler(InscriptionNotFoundException.class)
    public ResponseEntity<?> handleInscriptionNotFound(InscriptionNotFoundException e) {
        log.warn("Inscription non trouvée : {}", e.getMessage());
        String msg = getMessage("error.inscription.notfound", e.getInscriptionId());
        return erreur(HttpStatus.NOT_FOUND, "INSCRIPTION_NOT_FOUND", msg);
    }

    @ExceptionHandler(PaiementNotFoundException.class)
    public ResponseEntity<?> handlePaiementNotFound(PaiementNotFoundException e) {
        log.warn("Paiement non trouvé : {}", e.getMessage());
        String msg = getMessage("error.paiement.notfound", e.getPaiementId());
        return erreur(HttpStatus.NOT_FOUND, "PAIEMENT_NOT_FOUND", msg);
    }

    @ExceptionHandler(UtilisateurNotFoundException.class)
    public ResponseEntity<?> handleUtilisateurNotFound(UtilisateurNotFoundException e) {
        log.warn("Utilisateur non trouvé : {}", e.getMessage());
        String msg = getMessage("error.utilisateur.notfound", e.getEmail() != null ? e.getEmail() : "id=" + e.getMessage());
        return erreur(HttpStatus.NOT_FOUND, "UTILISATEUR_NOT_FOUND", msg);
    }

    @ExceptionHandler(UniversiteNotFoundException.class)
    public ResponseEntity<?> handleUniversiteNotFound(UniversiteNotFoundException e) {
        log.warn("Université non trouvée : {}", e.getMessage());
        String msg = getMessage("error.universite.notfound", e.getUniversiteId());
        return erreur(HttpStatus.NOT_FOUND, "UNIVERSITE_NOT_FOUND", msg);
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

    @ExceptionHandler(CoursNotFoundException.class)
    public ResponseEntity<?> handleCoursNotFound(CoursNotFoundException e) {
        log.warn("Cours non trouvé : {}", e.getMessage());
        String msg = getMessage("error.cours.notfound", e.getCoursId());
        return erreur(HttpStatus.NOT_FOUND, "COURS_NOT_FOUND", msg);
    }

    @ExceptionHandler(NoteNotFoundException.class)
    public ResponseEntity<?> handleNoteNotFound(NoteNotFoundException e) {
        log.warn("Note non trouvée : {}", e.getMessage());
        String msg = getMessage("error.note.notfound", e.getNoteId());
        return erreur(HttpStatus.NOT_FOUND, "NOTE_NOT_FOUND", msg);
    }

    @ExceptionHandler(NoteStatutException.class)
    public ResponseEntity<?> handleNoteStatut(NoteStatutException e) {
        log.warn("Statut note invalide : {}", e.getMessage());
        String msg = getMessage("error.note.statut.invalid", e.getOperation(), e.getStatutActuel());
        return erreur(HttpStatus.BAD_REQUEST, "NOTE_STATUT_INVALID", msg);
    }

    @ExceptionHandler(ExamenNotFoundException.class)
    public ResponseEntity<?> handleExamenNotFound(ExamenNotFoundException e) {
        log.warn("Examen non trouvé : {}", e.getMessage());
        String msg = getMessage("error.examen.notfound", e.getExamenId());
        return erreur(HttpStatus.NOT_FOUND, "EXAMEN_NOT_FOUND", msg);
    }

    @ExceptionHandler(EcheancierNotFoundException.class)
    public ResponseEntity<?> handleEcheancierNotFound(EcheancierNotFoundException e) {
        log.warn("Échéancier non trouvé : {}", e.getMessage());
        return erreur(HttpStatus.NOT_FOUND, "ECHEANCIER_NOT_FOUND", e.getMessage());
    }

    @ExceptionHandler(EcheanceNotFoundException.class)
    public ResponseEntity<?> handleEcheanceNotFound(EcheanceNotFoundException e) {
        log.warn("Échéance non trouvée : {}", e.getMessage());
        return erreur(HttpStatus.NOT_FOUND, "ECHEANCE_NOT_FOUND", e.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleResourceNotFound(ResourceNotFoundException e) {
        log.warn("Ressource non trouvée : {}", e.getMessage());
        return erreur(HttpStatus.NOT_FOUND,
            e.getResourceType().toUpperCase() + "_NOT_FOUND", e.getMessage());
    }

    // ─── ERREURS CLIENT MAL CLASSÉES (400 / 405) ─────────────────
    //
    // Sans ces trois gestionnaires, une requête mal formée par l'appelant
    // ressortait en 500 INTERNAL_ERROR : un paramètre requis oublié, un
    // identifiant non numérique dans l'URL ou un verbe HTTP inadapté étaient
    // présentés comme une panne serveur. Constaté le 03/08/2026 en parcourant
    // les portails. Conséquence : le client ne sait pas que la faute est chez
    // lui, et la supervision compte des pannes qui n'en sont pas.

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<?> handleParametreManquant(MissingServletRequestParameterException e) {
        log.warn("Paramètre requis absent : {}", e.getParameterName());
        return erreur(HttpStatus.BAD_REQUEST, "PARAMETRE_MANQUANT",
            "Le paramètre « " + e.getParameterName() + " » est obligatoire.");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<?> handleTypeInvalide(MethodArgumentTypeMismatchException e) {
        log.warn("Type invalide pour « {} » : {}", e.getName(), e.getValue());
        return erreur(HttpStatus.BAD_REQUEST, "PARAMETRE_INVALIDE",
            "La valeur fournie pour « " + e.getName() + " » n'est pas du type attendu.");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<?> handleMethodeNonSupportee(HttpRequestMethodNotSupportedException e) {
        log.warn("Méthode {} non supportée sur cette route", e.getMethod());
        return erreur(HttpStatus.METHOD_NOT_ALLOWED, "METHODE_NON_AUTORISEE",
            "La méthode " + e.getMethod() + " n'est pas autorisée sur cette ressource.");
    }

    // ─── VALIDATION (400) ────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(MethodArgumentNotValidException e) {
        Map<String, String> erreurs = e.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Valeur invalide",
                (existing, replacement) -> existing
            ));
        log.warn("Erreurs de validation : {}", erreurs);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error("VALIDATION_ERROR", "Données invalides",
                HttpStatus.BAD_REQUEST.value(), erreurs));
    }

    // ─── BUSINESS RULES (400) ────────────────────────────────────

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<?> handleBusinessException(BusinessException e) {
        log.warn("Règle métier violée [{}] : {}", e.getCode(), e.getMessage());
        return erreur(HttpStatus.BAD_REQUEST, e.getCode(), e.getMessage());
    }

    // ─── PAIEMENT / OPÉRATEUR EXTERNE (502 / 503) ────────────────

    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<?> handlePayment(PaymentException e) {
        // Circuit breaker ouvert → 503 (indisponibilité temporaire, réessayable).
        if ("OPERATEUR_INDISPONIBLE".equals(e.getErrorCode())) {
            log.warn("Paiement indisponible (circuit ouvert) : {}", e.getMessage());
            return erreur(HttpStatus.SERVICE_UNAVAILABLE, e.getErrorCode(), e.getMessage());
        }
        log.warn("Erreur paiement [{}] : {}", e.getErrorCode(), e.getMessage());
        return erreur(HttpStatus.BAD_REQUEST, e.getErrorCode(), e.getMessage());
    }

    @ExceptionHandler(OperateurPaiementException.class)
    public ResponseEntity<?> handleOperateurPaiement(OperateurPaiementException e) {
        // Panne réseau/réponse d'un opérateur qui a échappé au circuit breaker → 502.
        log.error("Panne opérateur paiement {} : {}", e.getOperateur(), e.getMessage());
        return erreur(HttpStatus.BAD_GATEWAY, "OPERATEUR_PAIEMENT_ERREUR",
            "Le service de paiement " + e.getOperateur() + " a rencontré une erreur. Réessayez plus tard.");
    }

    // ─── AUTH / ACCESS (401 / 403) ──────────────────────────────

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<?> handleInvalidCredentials(InvalidCredentialsException e) {
        log.warn("Tentative d'authentification échouée : {}", e.getEmail());
        String msg = getMessage("error.invalid.credentials");
        return erreur(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", msg);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException e) {
        log.warn("Accès refusé : {}", e.getMessage());
        String msg = getMessage("error.access.denied");
        return erreur(HttpStatus.FORBIDDEN, "ACCESS_DENIED", msg);
    }

    // ─── CONFLICT (409) ──────────────────────────────────────────

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<?> handleEmailAlreadyExists(EmailAlreadyExistsException e) {
        log.warn("Email déjà utilisé : {}", e.getEmail());
        String msg = getMessage("error.email.already.exists", e.getEmail());
        return erreur(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", msg);
    }

    // ─── CLIENT DISCONNECT (bénin) ───────────────────────────────

    @ExceptionHandler(ClientAbortException.class)
    public void handleClientAbort(ClientAbortException e) {
        // Connexion fermée par le client avant la fin de la réponse — non bloquant, pas une erreur
        log.debug("Client déconnecté en cours de réponse : {}", e.getMessage());
    }

    // ─── ROUTE INEXISTANTE (404, pas 500) ────────────────────────
    // Sans ce handler, une URL non mappée tombe dans handleException et
    // ressort en 500 « erreur interne », ce qui masque la vraie cause
    // (endpoint jamais implémenté ou faute de frappe côté frontend).

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<?> handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException e) {
        log.warn("Route inexistante appelée : {}", e.getResourcePath());
        return erreur(HttpStatus.NOT_FOUND, "NOT_FOUND",
            "Cette ressource n'existe pas : " + e.getResourcePath());
    }

    // ─── GENERIC (500) ───────────────────────────────────────────

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleGenericException(RuntimeException e) {
        log.error("Erreur interne : ", e);
        String msg = getMessage("error.internal");
        return erreur(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", msg);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        log.error("Erreur non attendue : ", e);
        String msg = getMessage("error.unexpected");
        return erreur(HttpStatus.INTERNAL_SERVER_ERROR, "UNEXPECTED_ERROR", msg);
    }
}
