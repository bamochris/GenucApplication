package cd.genuc.model;

/**
 * Énumération des statuts internes d'une transaction.
 * Sert à tracer l'évolution fine du processus (logs) et complète le PaymentStatusEnum
 * qui est plus orienté "état financier final".
 */
public enum TransactionStatusEnum {

    /**
     * Transaction créée, en attente d'initialisation (état initial par défaut dans Transaction).
     */
    INITIATED,

    /**
     * En attente d'une action de l'utilisateur (ex: validation de paiement, OTP).
     */
    PENDING,

    /**
     * En cours de traitement technique (appel à l'API du provider).
     */
    PROCESSING,

    /**
     * Paiement confirmé par le provider (équivalent au CONFIRMED de PaymentStatusEnum).
     */
    CONFIRMED,

    /**
     * Succès technique, en attente de validation comptable ou de livraison.
     */
    SUCCESS,

    /**
     * Transaction entièrement finalisée (service rendu, écriture comptable validée).
     */
    COMPLETED,

    /**
     * Échec du paiement (provider a retourné une erreur).
     */
    FAILED,

    /**
     * Annulée par l'utilisateur ou le système avant finalisation.
     */
    CANCELLED,

    /**
     * Remboursée (totale ou partielle).
     */
    REFUNDED,

    /**
     * En litige (contestation client/provider).
     */
    DISPUTED,

    /**
     * Réconciliée avec le système comptable (vient de PaymentStatusEnum).
     */
    RECONCILED,

    /**
     * Expirée (délai de traitement dépassé).
     */
    EXPIRED,

    /**
     * Rejetée par le provider (motif réglementaire, frauduleux ou violation de règles).
     */
    REJECTED,

    /**
     * Vérifiée manuellement par un administrateur.
     */
    VERIFIED
}