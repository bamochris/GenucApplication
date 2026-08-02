package cd.genuc.model;

/**
 * Rôles utilisateur stockés sur {@link Utilisateur#role}.
 * Noms alignés sur les annotations @PreAuthorize du projet.
 */
public enum RoleEnum {
    SUPER_ADMIN,
    ADMIN_UNIVERSITE,
    UNIVERSITY_ADMIN,
    RECTEUR,
    DOYEN,
    DEAN,
    CHEF_DEPARTEMENT,
    DEPARTMENT_HEAD,
    CHEF_PROMOTION,
    COORDINATEUR,
    PROFESSEUR,
    PROFESSOR,
    ENSEIGNANT,
    LECTURER,
    CORRECTEUR,
    SECRETAIRE_ACADEMIQUE,
    REGISTRAR,
    CAISSIER,
    AGENT,
    COMPTABLE,
    FINANCE_MANAGER,
    RH,
    HR_MANAGER,
    PERSONNEL,
    BIBLIOTHECAIRE,
    LIBRARIAN,
    APPARITEUR,
    SERVICE_SOCIAL,
    ADMIN_SYSTEME,
    AUDITEUR,
    ETUDIANT,
    STUDENT,
    PARENT,
    INVITE,
    GUEST,
    STAFF
}
