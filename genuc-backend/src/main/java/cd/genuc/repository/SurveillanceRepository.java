package cd.genuc.repository;

import cd.genuc.model.Surveillance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SurveillanceRepository extends JpaRepository<Surveillance, Long> {

    List<Surveillance> findBySurveillantId(Long surveillantId);

    List<Surveillance> findByExamenId(Long examenId);

    List<Surveillance> findByDateSurveillance(LocalDate date);

    List<Surveillance> findBySalleId(Long salleId);
}