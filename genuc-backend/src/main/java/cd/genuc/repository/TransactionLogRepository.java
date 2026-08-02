package cd.genuc.repository;

import cd.genuc.model.TransactionLog;
import cd.genuc.model.TransactionStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionLogRepository extends JpaRepository<TransactionLog, Long> {

    List<TransactionLog> findByTransactionIdOrderByCreatedAtDesc(Long transactionId);

    @Query("SELECT tl FROM TransactionLog tl WHERE tl.transaction.id = :transactionId AND tl.statusTo = :status")
    List<TransactionLog> findByTransactionAndStatus(@Param("transactionId") Long transactionId,
                                                    @Param("status") TransactionStatusEnum status);

    @Query("SELECT tl FROM TransactionLog tl WHERE tl.createdAt BETWEEN :debut AND :fin ORDER BY tl.createdAt DESC")
    List<TransactionLog> findByDateRange(@Param("debut") LocalDateTime debut, @Param("fin") LocalDateTime fin);

    @Query("SELECT tl FROM TransactionLog tl WHERE tl.statusTo = :status AND tl.createdAt BETWEEN :debut AND :fin ORDER BY tl.createdAt DESC")
    List<TransactionLog> findFailedTransactionsByDateRange(@Param("status") TransactionStatusEnum status,
                                                           @Param("debut") LocalDateTime debut,
                                                           @Param("fin") LocalDateTime fin);
}
