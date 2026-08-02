package cd.genuc.repository;

import cd.genuc.model.CommentaireTfc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentaireTfcRepository extends JpaRepository<CommentaireTfc, Long> {

    List<CommentaireTfc> findByTfcIdOrderByDateAsc(Long tfcId);
}
