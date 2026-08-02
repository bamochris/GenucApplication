package cd.genuc.model;

/**
 * Types de documents pouvant recevoir une signature électronique.
 * Extensible sans migration de schéma (stocké en STRING).
 */
public enum TypeDocumentSignable {
    ATTESTATION,
    DIPLOME,
    LETTRE_ACCEPTATION,
    RELEVE_NOTES,
    BULLETIN
}
