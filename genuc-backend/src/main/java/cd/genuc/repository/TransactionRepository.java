package cd.genuc.repository;

import cd.genuc.model.PaymentMethodEnum;
import cd.genuc.model.PaymentStatusEnum;
import cd.genuc.model.Transaction;
import cd.genuc.model.TransactionStatusEnum;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionCode(String transactionCode);

    Optional<Transaction> findByProviderTransactionId(String providerTransactionId);

    List<Transaction> findByStudentId(Long studentId);

    List<Transaction> findByUniversiteId(Long universiteId);

    // Transactions en attente depuis un certain temps
    List<Transaction> findByPaymentStatusAndInitiatedAtBefore(PaymentStatusEnum status, LocalDateTime date);

    // Transactions en traitement depuis un certain temps
    List<Transaction> findByTransactionStatusAndInitiatedAtBefore(TransactionStatusEnum status, LocalDateTime date);

    // Compter par statut
    long countByPaymentStatus(PaymentStatusEnum status);

    // Compter par méthode et statut
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.paymentMethod = :method AND t.paymentStatus = :status")
    long countByPaymentMethodAndStatus(@Param("method") PaymentMethodEnum method,
                                       @Param("status") PaymentStatusEnum status);

    // Transactions récentes d'une université
    List<Transaction> findByUniversiteIdOrderByCreatedAtDesc(Long universiteId);

    // ✅ CORRECTION : utilisation de @Query pour éviter l'erreur "No property 'dateRange'"
    @Query("SELECT t FROM Transaction t WHERE t.initiatedAt BETWEEN :start AND :end AND t.universite.id = :universiteId")
    List<Transaction> findTransactionsByDateRangeAndUniversity(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("universiteId") Long universiteId);

    // Paginées
    Page<Transaction> findByStudentId(Long studentId, Pageable pageable);

    Page<Transaction> findByUniversiteId(Long universiteId, Pageable pageable);

    // ─── Mises à jour atomiques (compare-and-swap) pour les jobs planifiés ───
    // Évite la race condition multi-instances : le UPDATE ne s'applique que si le
    // statut en base est toujours celui attendu au moment de l'écriture (pas de
    // fetch-then-save qui pourrait écraser un callback webhook arrivé entre-temps).

    @Modifying
    @Query("UPDATE Transaction t SET t.paymentStatus = :nouveauPaymentStatus, "
         + "t.transactionStatus = :nouveauTransactionStatus, t.notes = :notes, "
         + "t.completedAt = :completedAt "
         + "WHERE t.id = :id AND t.paymentStatus = :statutAttendu")
    int expirerSiToujoursEnAttente(
            @Param("id") Long id,
            @Param("statutAttendu") PaymentStatusEnum statutAttendu,
            @Param("nouveauPaymentStatus") PaymentStatusEnum nouveauPaymentStatus,
            @Param("nouveauTransactionStatus") TransactionStatusEnum nouveauTransactionStatus,
            @Param("notes") String notes,
            @Param("completedAt") LocalDateTime completedAt);

    @Modifying
    @Query("UPDATE Transaction t SET t.paymentStatus = :nouveauPaymentStatus, "
         + "t.transactionStatus = :nouveauTransactionStatus, t.notes = :notes, "
         + "t.completedAt = :completedAt "
         + "WHERE t.id = :id AND t.transactionStatus = :statutAttendu")
    int echouerSiToujoursEnTraitement(
            @Param("id") Long id,
            @Param("statutAttendu") TransactionStatusEnum statutAttendu,
            @Param("nouveauPaymentStatus") PaymentStatusEnum nouveauPaymentStatus,
            @Param("nouveauTransactionStatus") TransactionStatusEnum nouveauTransactionStatus,
            @Param("notes") String notes,
            @Param("completedAt") LocalDateTime completedAt);
}